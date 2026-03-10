.PHONY: install dev backend frontend test test-backend test-frontend clean

install:
	cd backend && pip install -e ".[dev]"
	cd frontend && npm install

backend:
	cd backend && python -m uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Run these in separate terminals:"
	@echo "  make backend"
	@echo "  make frontend"

test: test-backend test-frontend

test-backend:
	cd backend && python -m pytest tests/ -v

test-frontend:
	cd frontend && npm test

clean:
	python -c "from pathlib import Path; import shutil; [shutil.rmtree(path, ignore_errors=True) for path in Path('.').rglob('__pycache__') if path.is_dir()]; [shutil.rmtree(Path(path), ignore_errors=True) for path in ['backend/.pytest_cache', 'frontend/node_modules/.vite']]"
