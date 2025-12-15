"""
PictoBERT FastAPI server for next pictogram prediction.

Based on https://github.com/jayralencar/pictoBERT
"""

import requests
from pathlib import Path
from typing import Optional

import nltk
import numpy as np
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nltk.corpus import wordnet as wn
from torch.nn import functional as F
from pydantic import BaseModel
from transformers import BertForMaskedLM, PreTrainedTokenizerFast

# Download WordNet data (required for synset conversion)
nltk.download("wordnet", quiet=True)

app = FastAPI(title="PictoBERT Service", version="1.0.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration
MODEL_DIR = Path(__file__).parent / "models"

# Global model and tokenizer
model: Optional[BertForMaskedLM] = None
tokenizer: Optional[PreTrainedTokenizerFast] = None
df: Optional[pd.DataFrame] = None
mapped_vocab: Optional[np.ndarray] = None
valid_token_indices: Optional[torch.Tensor] = None


def download_file(url: str, dest: Path) -> None:
    """Download a file from URL to destination."""
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Downloaded to {dest}")


def setup_model() -> None:
    """Download and setup the PictoBERT model if not present."""
    global model, tokenizer, df, mapped_vocab, valid_token_indices

    if not MODEL_DIR.exists():
        raise FileNotFoundError(f"Model directory not found at {MODEL_DIR}")

    # Download tokenizer
    tokenizer_path = MODEL_DIR / "childes_all_new.json"
    if not tokenizer_path.exists():
        raise FileNotFoundError(f"Tokenizer file not found at {tokenizer_path}")

    # Download and extract model
    model_path = MODEL_DIR / "arasaac-pictobert-context"
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")

    # Download ARASAAC mapping
    mapping_path = MODEL_DIR / "arasaac_mapping.csv"
    if not mapping_path.exists():
        raise FileNotFoundError(f"Mapping file not found at {mapping_path}")

    # Load tokenizer
    print("Loading tokenizer...")
    tokenizer = PreTrainedTokenizerFast(tokenizer_file=str(tokenizer_path))
    tokenizer.pad_token = "[PAD]"
    tokenizer.sep_token = "[SEP]"
    tokenizer.mask_token = "[MASK]"
    tokenizer.cls_token = "[CLS]"
    tokenizer.unk_token = "[UNK]"

    # Load ARASAAC mapping indexed by synset
    print("Loading ARASAAC mapping...")
    df = pd.read_csv(mapping_path, index_col=0)
    # Re-index by synset for fast lookup
    df = df.set_index("synset")
    print(df.head())

    # Build vocabulary mapping: convert word senses to synset IDs using WordNet
    print("Building vocabulary filter with WordNet synset conversion...")
    vocab = tokenizer.get_vocab()
    mapped_vocab = np.empty(len(vocab), dtype=object)
    
    for word_sense, idx in vocab.items():
        try:
            # Convert word sense key to synset ID (e.g., "girl%1:18:02::" -> "10129825-n")
            synset = wn.lemma_from_key(word_sense).synset()
            synset_id = str(synset.offset()).zfill(8) + "-" + synset.pos()
            mapped_vocab[idx] = synset_id
        except Exception:
            # Keep original for special tokens or unrecognized keys
            mapped_vocab[idx] = word_sense
    
    # Find which vocab tokens have matching synsets in ARASAAC
    unique_synsets = np.unique(df.index.astype(str).to_numpy())
    isin = np.isin(mapped_vocab, unique_synsets)
    valid_token_indices = torch.from_numpy(isin.nonzero()[0])
    print(f"Found {len(valid_token_indices)} valid ARASAAC tokens out of {len(vocab)} vocab tokens")

    # Load model
    print("Loading PictoBERT model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = BertForMaskedLM.from_pretrained(str(model_path))
    model.to(device)
    model.eval()
    print(f"Model loaded on {device}")


class PredictRequest(BaseModel):
    """Request model for prediction."""
    selected_word_senses: list[str] = []


class PredictResponse(BaseModel):
    """Response model for prediction."""
    predictions: list[dict]


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    setup_model()


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict next pictograms based on currently selected word-senses.

    The model uses masked language modeling to predict what comes next.
    """
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    device = next(model.parameters()).device

    word_senses = request.selected_word_senses.copy()
    print("Word senses:", word_senses)
    word_senses.append("[MASK]")
    word_senses.append(".")
    input_text = " ".join(word_senses)
    print("Input text:", input_text)

    tokenized = tokenizer(input_text, return_tensors="pt")
    input_ids = tokenized['input_ids'].to(device)
    attention_mask = tokenized['attention_mask'].to(device)
    
    # Debug: show how input was tokenized
    tokens = tokenizer.convert_ids_to_tokens(input_ids[0].tolist())
    print("Tokenized:", tokens)
    
    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
        all_probs = F.softmax(outputs[0], dim=-1)
        mask_idx = input_ids.tolist()[0].index(tokenizer.mask_token_id)
        print(f"Mask index: {mask_idx}")
        
        # Filter to only valid ARASAAC tokens
        filtered_probs = torch.index_select(all_probs[0, mask_idx, :], 0, valid_token_indices.to(device))
        filtered_vocab = mapped_vocab.take(valid_token_indices.numpy())
        
        # Get all predictions sorted from highest to lowest probability
        sorted_probs, sorted_indices = torch.sort(filtered_probs, descending=True)

    predictions = []
    for prob, idx in zip(sorted_probs.tolist(), sorted_indices.tolist()):
        synset_id = filtered_vocab[idx]
        
        # Look up pictogram ID from dataframe using synset ID
        try:
            row = df.loc[synset_id]
            # Handle case where multiple rows match (DataFrame vs Series)
            if isinstance(row, pd.DataFrame):
                pictogram_id = int(row['pictogram_id'].iloc[0])
                word = row['word'].iloc[0]
                word_sense = row['word_senses'].iloc[0]
            else:
                pictogram_id = int(row['pictogram_id'])
                word = row['word']
                word_sense = row['word_senses']
        except KeyError:
            print(f"No mapping found for synset: {synset_id}")
            continue

        predictions.append({
            "word_sense": word_sense,
            "word": word,
            "probability": prob,
            "pictogram_id": pictogram_id,
        })

    for prediction in predictions:
        print(prediction)

    return PredictResponse(predictions=predictions)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
