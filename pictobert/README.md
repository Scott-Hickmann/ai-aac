# PictoBERT Service

This directory contains a FastAPI server that serves the [PictoBERT](https://github.com/jayralencar/pictoBERT) model for next pictogram prediction.

PictoBERT is a BERT-based transformer model specifically trained for predicting the next pictogram in AAC (Augmentative and Alternative Communication) contexts.

## Setup

1. Create a Python virtual environment:

```bash
cd pictobert
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the server:

```bash
python server.py
```

The server will:
- Download the PictoBERT model (~200MB) on first run
- Download the ARASAAC word-sense mappings
- Start serving on http://localhost:8000

## API Endpoints

### `GET /health`
Health check endpoint.

### `POST /predict`
Predict next pictograms based on currently selected word-senses.

Request body:
```json
{
  "selected_word_senses": ["eat.v.01", "apple.n.01"],
  "top_k": 20
}
```

Response:
```json
{
  "predictions": [
    {
      "word_sense": "drink.v.01",
      "probability": 0.15,
      "pictogram_id": 12345
    }
  ]
}
```

## Configuration

Set the `PICTOBERT_URL` environment variable in the main app to point to this service (defaults to `http://localhost:8000`).

## Model Details

This service uses the ARASAAC-fine-tuned PictoBERT model, which has been specifically trained on the ARASAAC pictogram vocabulary. The model predicts the next pictogram based on the sequence of previously selected pictograms.

For more information, see the [PictoBERT paper](https://www.sciencedirect.com/science/article/pii/S095741742200611X).
