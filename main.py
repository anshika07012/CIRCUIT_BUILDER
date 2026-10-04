from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

import uvicorn


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# DATA MODELS
# ==========================================

class Gate(BaseModel):
    gate: str
    qubit: int | None = None
    control: int | None = None
    target: int | None = None
    column: int


class CircuitRequest(BaseModel):
    num_qubits: int
    gates: list[Gate]


# ==========================================
# SIMULATION
# ==========================================

@app.post("/simulate")
def simulate(request: CircuitRequest):

    # Create circuit
    qc = QuantumCircuit(request.num_qubits)

    # Apply gates in column order
    sorted_gates = sorted(
        request.gates,
        key=lambda gate: gate.column
    )

    for gate in sorted_gates:

        if gate.gate == "H":
            qc.h(gate.qubit)

        elif gate.gate == "X":
            qc.x(gate.qubit)

        elif gate.gate == "Y":
            qc.y(gate.qubit)

        elif gate.gate == "Z":
            qc.z(gate.qubit)

        elif gate.gate == "CNOT":
            qc.cx(
                gate.control,
                gate.target
            )

    # ======================================
    # SIMULATOR
    # ======================================

    simulator = AerSimulator()

    # Transpile circuit for Aer
    compiled_circuit = transpile(
        qc,
        simulator
    )

    # ======================================
    # MEASUREMENT
    # ======================================

    measurement_circuit = compiled_circuit.copy()

    measurement_circuit.measure_all()

    measurement_circuit = transpile(
        measurement_circuit,
        simulator
    )

    result = simulator.run(
        measurement_circuit,
        shots=1024
    ).result()

    counts = result.get_counts()

    # ======================================
    # PROBABILITIES
    # ======================================

    probabilities = {
        state: count / 1024
        for state, count in counts.items()
    }

    # ======================================
    # STATEVECTOR
    # ======================================

    statevector_circuit = qc.copy()

    statevector_circuit.save_statevector()

    statevector_circuit = transpile(
        statevector_circuit,
        simulator
    )

    statevector_result = simulator.run(
        statevector_circuit
    ).result()

    statevector = statevector_result.get_statevector()

    statevector_data = []

    for amplitude in statevector:

        statevector_data.append(
            {
                "real": float(amplitude.real),
                "imaginary": float(amplitude.imag)
            }
        )

    # ======================================
    # CIRCUIT DIAGRAM
    # ======================================

    circuit_diagram = str(
        qc.draw(output="text")
    )

    # ======================================
    # RETURN RESULTS
    # ======================================

    return {
        "counts": counts,
        "probabilities": probabilities,
        "statevector": statevector_data,
        "circuit": circuit_diagram
    }


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001
    )