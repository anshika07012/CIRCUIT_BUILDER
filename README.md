# QURIO Circuit Builder 
 
QURIO Circuit Builder is an interactive web-based quantum circuit builder designed to make quantum computing easier to learn through hands-on experimentation.

## Features

* Build quantum circuits using gates such as **H, X, Y, Z and CNOT**
* Work with multiple qubits and circuit columns
* Simulate circuits using **Qiskit Aer**
* View measurement outcomes and probability distributions
* Visualize quantum-state changes
* Explore concepts such as **superposition and entanglement**
* Learn quantum computing without requiring physical quantum hardware

## Tech Stack

### Frontend

* React
* Vite
* HTML/CSS/JavaScript

### Backend

* Python
* FastAPI
* Qiskit
* Qiskit Aer

## How It Works

**Build → Simulate → Visualize → Understand**

1. Select quantum gates from the available gate panel.
2. Place gates on the required qubits and circuit positions.
3. Run the circuit simulation.
4. The frontend sends the circuit information to the FastAPI backend.
5. Qiskit Aer processes and simulates the circuit.
6. The results are returned and displayed visually.

## Project Structure

```text
circuit-builder/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── backend/
    ├── main.py
    └── requirements.txt
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd circuit-builder
```

### 2. Start the frontend

```bash
npm install
npm run dev
```

### 3. Start the backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The frontend and backend should be running simultaneously.

## Purpose

QURIO Circuit Builder aims to bridge the gap between theoretical quantum-computing concepts and practical experimentation by allowing learners to visually construct circuits and immediately observe their results.

## Future Scope

* More quantum gates
* Advanced circuit operations
* Step-by-step circuit execution
* Improved quantum-state visualizations
* More interactive learning features
* Integration with additional quantum simulators
