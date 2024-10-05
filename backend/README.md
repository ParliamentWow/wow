# Setup

Optional: use `pyenv` to install python 3.11

```
pyenv virtualenv 3.11 wow
pyenv local wow
pyenv activate wow
```

```
uv pip install -e .
uv run modal setup
```

# Run

```
uv run transcribe.py
```
