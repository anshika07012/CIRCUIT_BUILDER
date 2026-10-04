import "./App.css";
import { useState } from "react";

const gateInfo = {
  H: {
    name: "Hadamard Gate",
    explanation: "Creates a superposition of |0⟩ and |1⟩.",
    formula: "|0⟩ → (|0⟩ + |1⟩) / √2",
  },

  X: {
    name: "Pauli-X Gate",
    explanation:
      "Flips the qubit from |0⟩ to |1⟩ or |1⟩ to |0⟩.",
    formula: "|0⟩ ↔ |1⟩",
  },

  Y: {
    name: "Pauli-Y Gate",
    explanation:
      "Rotates the qubit around the Y-axis of the Bloch sphere.",
    formula: "Y|0⟩ = i|1⟩",
  },

  Z: {
    name: "Pauli-Z Gate",
    explanation: "Changes the phase of the |1⟩ state.",
    formula: "Z|1⟩ = −|1⟩",
  },

  CNOT: {
    name: "Controlled-NOT Gate",
    explanation:
      "Flips the target qubit when the control qubit is |1⟩.",
    formula: "|10⟩ → |11⟩",
  },
};


// =====================================================
// CORRECT BLOCH VECTOR CALCULATION
// =====================================================

function calculateBlochVector(statevector, qubit) {
  if (!statevector || statevector.length === 0) {
    return {
      x: 0,
      y: 0,
      z: 1,
    };
  }

  const dimension = statevector.length;

  let x = 0;
  let y = 0;
  let z = 0;

  const bitPosition = qubit;

  for (let i = 0; i < dimension; i++) {
    const bit = (i >> bitPosition) & 1;

    const realA = Number(statevector[i]?.real ?? 0);
    const imagA = Number(statevector[i]?.imaginary ?? 0);

    const probability =
      realA * realA +
      imagA * imagA;

    if (bit === 0) {
      z += probability;
    } else {
      z -= probability;
    }

    if (bit === 0) {
      const j = i ^ (1 << bitPosition);

      if (j < dimension) {
        const realB = Number(
          statevector[j]?.real ?? 0
        );

        const imagB = Number(
          statevector[j]?.imaginary ?? 0
        );

        const realProduct =
          realA * realB +
          imagA * imagB;

        const imagProduct =
          realA * imagB -
          imagA * realB;

        x += 2 * realProduct;
        y += 2 * imagProduct;
      }
    }
  }

  const clean = (value) => {
    if (Math.abs(value) < 0.000001) return 0;

    if (Math.abs(value - 1) < 0.000001) return 1;

    if (Math.abs(value + 1) < 0.000001) return -1;

    return value;
  };

  return {
    x: clean(x),
    y: clean(y),
    z: clean(z),
  };
}


// =====================================================
// AMPLITUDE FORMATTER
// =====================================================

function formatNumber(value) {
  const number = Number(value ?? 0);

  if (Math.abs(number) < 0.0005) {
    return "0.000";
  }

  return number.toFixed(3);
}


// =====================================================
// MAIN APP
// =====================================================

function App() {
  const columns = [0, 1, 2, 3, 4, 5];
  const qubits = [0, 1, 2];

  const [circuit, setCircuit] = useState({});
  const [cnotControl, setCnotControl] = useState(null);

  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [expandedSection, setExpandedSection] =
    useState(null);

  // =====================================================
  // LEARNING CLOUD STATE
  // =====================================================

  const [learningOpen, setLearningOpen] =
    useState(null);

  const [guide, setGuide] = useState({
    title: "Your Quantum Guide",
    message:
      "Drag a quantum gate onto the circuit and I'll explain what happens!",
    tip: "💡 Start with an H gate on q₀.",
  });


  // =====================================================
  // BLOCH VECTORS
  // =====================================================

  const blochVectors = results?.statevector
    ? qubits.map((qubit) =>
        calculateBlochVector(
          results.statevector,
          qubit
        )
      )
    : [
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 1 },
      ];


  // =====================================================
  // GUIDE
  // =====================================================

  const explainGate = (gate, qubit) => {
    const explanations = {
      H: {
        title: "✨ Hadamard Gate",
        message:
          `You placed an H gate on q₍${qubit}₎! The Hadamard gate creates a superposition, so the qubit can have a probability of being measured as 0 or 1.`,
        tip:
          "💡 Think of it like spinning a coin. Instead of simply heads or tails, it is in a quantum superposition.",
      },

      X: {
        title: "🔄 Pauli-X Gate",
        message:
          `You placed an X gate on q₍${qubit}₎! It flips the qubit. If it was |0⟩, it becomes |1⟩. If it was |1⟩, it becomes |0⟩.`,
        tip:
          "💡 Think of X like the NOT gate from classical computing.",
      },

      Y: {
        title: "🌀 Pauli-Y Gate",
        message:
          `You placed a Y gate on q₍${qubit}₎! It rotates the quantum state around the Y-axis of the Bloch sphere.`,
        tip:
          "💡 Quantum gates can be visualized as rotations of a qubit.",
      },

      Z: {
        title: "⚡ Pauli-Z Gate",
        message:
          `You placed a Z gate on q₍${qubit}₎! It changes the phase of the quantum state.`,
        tip:
          "💡 Z changes the quantum phase while keeping the basic measurement probabilities unchanged.",
      },
    };

    if (explanations[gate]) {
      setGuide(explanations[gate]);
    }
  };


  // =====================================================
  // LEARNING CLOUD TOGGLE
  // =====================================================

  const toggleLearning = (section) => {
    setLearningOpen((previous) =>
      previous === section
        ? null
        : section
    );
  };


  // =====================================================
  // DRAG START
  // =====================================================

  const handleDragStart = (event, gate) => {
    event.dataTransfer.setData("gate", gate);
  };


  // =====================================================
  // DROP GATE
  // =====================================================

  const handleDrop = (
    event,
    qubit,
    column
  ) => {
    event.preventDefault();

    const gate =
      event.dataTransfer.getData("gate");

    if (!gate) return;

    if (gate !== "CNOT") {
      const key = `${qubit}-${column}`;

      setCircuit((previous) => ({
        ...previous,
        [key]: gate,
      }));

      setResults(null);
      setError("");

      explainGate(gate, qubit);

      return;
    }

    setCnotControl({
      qubit,
      column,
    });

    setResults(null);
    setError("");

    setGuide({
      title: "🔗 CNOT Gate",
      message:
        `Great! q₍${qubit}₎ is now the control qubit. Now click another qubit in the SAME column to select the target.`,
      tip:
        "💡 Think of CNOT like a boss and follower: the target flips when the control qubit is |1⟩.",
    });
  };


  // =====================================================
  // CNOT TARGET
  // =====================================================

  const handleCnotTarget = (
    qubit,
    column
  ) => {
    if (!cnotControl) return;

    if (
      column !==
      cnotControl.column
    ) {
      setGuide({
        title: "⚠️ Same Column Required",
        message:
          "The CNOT control and target must be in the same column.",
        tip:
          "💡 Try clicking a different qubit directly above or below the control.",
      });

      return;
    }

    if (
      qubit ===
      cnotControl.qubit
    ) {
      setGuide({
        title: "⚠️ Choose Another Qubit",
        message:
          "The control and target must be two different qubits.",
        tip:
          "💡 Select another qubit in the same column.",
      });

      return;
    }

    const controlKey =
      `${cnotControl.qubit}-${cnotControl.column}`;

    const targetKey =
      `${qubit}-${column}`;

    setCircuit((previous) => ({
      ...previous,
      [controlKey]: "CONTROL",
      [targetKey]: "TARGET",
    }));

    setCnotControl(null);

    setResults(null);
    setError("");

    setGuide({
      title: "🔗 CNOT Connected!",
      message:
        `q₍${cnotControl.qubit}₎ controls q₍${qubit}₎. When the control qubit is |1⟩, the target qubit flips.`,
      tip:
        "💡 Control = boss 👑 | Target = follower 🔄",
    });
  };


  // =====================================================
  // FIND CNOT PARTNER
  // =====================================================

  const getCnotPartner = (
    column,
    qubit
  ) => {
    const current =
      circuit[`${qubit}-${column}`];

    if (current === "CONTROL") {
      return qubits.find(
        (q) =>
          circuit[
            `${q}-${column}`
          ] === "TARGET"
      );
    }

    if (current === "TARGET") {
      return qubits.find(
        (q) =>
          circuit[
            `${q}-${column}`
          ] === "CONTROL"
      );
    }

    return undefined;
  };


  // =====================================================
  // REMOVE ENTIRE CNOT
  // =====================================================

  const removeGate = (
    qubit,
    column
  ) => {
    const key =
      `${qubit}-${column}`;

    const gate =
      circuit[key];

    setCircuit((previous) => {
      const updatedCircuit = {
        ...previous,
      };

      if (gate === "CONTROL") {
        const targetQubit =
          qubits.find(
            (q) =>
              previous[
                `${q}-${column}`
              ] === "TARGET"
          );

        delete updatedCircuit[key];

        if (
          targetQubit !==
          undefined
        ) {
          delete updatedCircuit[
            `${targetQubit}-${column}`
          ];
        }
      }

      else if (
        gate === "TARGET"
      ) {
        const controlQubit =
          qubits.find(
            (q) =>
              previous[
                `${q}-${column}`
              ] === "CONTROL"
          );

        delete updatedCircuit[key];

        if (
          controlQubit !==
          undefined
        ) {
          delete updatedCircuit[
            `${controlQubit}-${column}`
          ];
        }
      }

      else {
        delete updatedCircuit[key];
      }

      return updatedCircuit;
    });

    setCnotControl(null);
    setResults(null);
    setError("");

    setGuide({
      title: "🗑️ Gate Removed",
      message:
        "That gate has been removed from your circuit.",
      tip:
        "💡 Try adding another gate and see how the circuit changes.",
    });
  };


  // =====================================================
  // ALLOW DROP
  // =====================================================

  const allowDrop = (event) => {
    event.preventDefault();
  };


  // =====================================================
  // QISKIT CODE
  // =====================================================

  const generateQiskitCode = () => {
    let code =
      `from qiskit import QuantumCircuit\n\n`;

    code +=
      `qc = QuantumCircuit(3)\n\n`;

    const gates = [];

    Object.entries(circuit).forEach(
      ([key, gate]) => {
        const [
          qubit,
          column,
        ] =
          key
            .split("-")
            .map(Number);

        if (
          ["H", "X", "Y", "Z"].includes(
            gate
          )
        ) {
          gates.push({
            column,
            code:
              `qc.${gate.toLowerCase()}(${qubit})`,
          });
        }
      }
    );

    columns.forEach(
      (column) => {
        const controlQubit =
          qubits.find(
            (qubit) =>
              circuit[
                `${qubit}-${column}`
              ] === "CONTROL"
          );

        const targetQubit =
          qubits.find(
            (qubit) =>
              circuit[
                `${qubit}-${column}`
              ] === "TARGET"
          );

        if (
          controlQubit !==
            undefined &&
          targetQubit !==
            undefined
        ) {
          gates.push({
            column,
            code:
              `qc.cx(${controlQubit}, ${targetQubit})`,
          });
        }
      }
    );

    gates
      .sort(
        (a, b) =>
          a.column - b.column
      )
      .forEach(
        (gate) => {
          code +=
            gate.code + "\n";
        }
      );

    return code;
  };


  // =====================================================
  // RUN CIRCUIT
  // =====================================================

  const runCircuit = async () => {
    setRunning(true);
    setError("");
    setResults(null);

    setGuide({
      title:
        "⚡ Running Your Circuit...",
      message:
        "Your circuit is being sent to the quantum simulator. Let's see what happens!",
      tip:
        "💡 The simulator performs quantum operations and then measures the result.",
    });

    try {
      const gates = [];

      Object.entries(circuit).forEach(
        ([key, gate]) => {
          const [
            qubit,
            column,
          ] =
            key
              .split("-")
              .map(Number);

          if (
            ["H", "X", "Y", "Z"].includes(
              gate
            )
          ) {
            gates.push({
              gate,
              qubit,
              column,
            });
          }
        }
      );

      columns.forEach(
        (column) => {
          const controlQubit =
            qubits.find(
              (qubit) =>
                circuit[
                  `${qubit}-${column}`
                ] === "CONTROL"
            );

          const targetQubit =
            qubits.find(
              (qubit) =>
                circuit[
                  `${qubit}-${column}`
                ] === "TARGET"
            );

          if (
            controlQubit !==
              undefined &&
            targetQubit !==
              undefined
          ) {
            gates.push({
              gate: "CNOT",
              control:
                controlQubit,
              target:
                targetQubit,
              column,
            });
          }
        }
      );

      const response =
        await fetch(
          "http://127.0.0.1:8001/simulate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              num_qubits: 3,
              gates: gates,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Simulation failed."
        );
      }

      const data =
        await response.json();

      setResults(data);

      setGuide({
        title:
          "🎉 Simulation Complete!",
        message:
          "Your quantum circuit has been successfully simulated! Open the simulation sections to explore the results.",
        tip:
          "💡 Change a gate, run the circuit again and compare how the results change.",
      });

    } catch (err) {
      console.error(err);

      setError(
        "Could not connect to the quantum simulator. Make sure the Python server is running."
      );

      setGuide({
        title:
          "⚠️ Simulator Connection Problem",
        message:
          "I couldn't connect to the quantum simulator.",
        tip:
          "💡 Make sure your Python FastAPI server is running on port 8001.",
      });
    }

    setRunning(false);
  };

  const resetCircuit = () => {
  setCircuit({});
  setCnotControl(null);
  setResults(null);
  setRunning(false);
  setError("");

  setGuide({
    title: "Your Quantum Guide",
    message:
      "Drag a quantum gate onto the circuit and I'll explain what happens!",
    tip: "💡 Start with an H gate on q₀.",
  });
};


  // =====================================================
  // EXPAND SIMULATION SECTION
  // =====================================================

  const toggleSection = (
    section
  ) => {
    setExpandedSection(
      (previous) =>
        previous === section
          ? null
          : section
    );
  };


  // =====================================================
  // BLOCH SPHERE PROJECTION
  // =====================================================

  const getBlochProjection = (
    vector
  ) => {
    const radius = 100;

    const px =
      vector.x * radius +
      vector.y * 38;

    const py =
      -vector.z * radius -
      vector.y * 18;

    return {
      x: px,
      y: py,
    };
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="quantum-builder">

      {/* ================================================= */}
      {/* BACKGROUND QUANTUM SPHERES */}
      {/* ================================================= */}

      <div className="bg-spheres">

        <div className="quantum-bubble bubble-1">
          |0⟩
        </div>

        <div className="quantum-bubble bubble-2">
          |+⟩
        </div>

        <div className="quantum-bubble bubble-3">
          |1⟩
        </div>

        <div className="quantum-bubble bubble-4">
          |−⟩
        </div>

        <div className="quantum-bubble bubble-5">
          |ψ⟩
        </div>

        <div className="quantum-bubble bubble-6">
          |0⟩
        </div>

        <div className="quantum-bubble bubble-7">
          |+⟩
        </div>

        <div className="quantum-bubble bubble-8">
          |1⟩
        </div>

        <div className="quantum-bubble bubble-9">
          |−⟩
        </div>

        <div className="quantum-bubble bubble-10">
          |ψ⟩
        </div>

        <div className="quantum-bubble bubble-11">
          |0⟩
        </div>

        <div className="quantum-bubble bubble-12">
          |+⟩
        </div>

        <div className="quantum-bubble bubble-13">
          |1⟩
        </div>

        <div className="quantum-bubble bubble-14">
          |ψ⟩
        </div>

        <div className="quantum-bubble bubble-15">
          |−⟩
        </div>

        <div className="quantum-bubble bubble-16">
          |0⟩
        </div>

        <div className="quantum-bubble bubble-17">
          |+⟩
        </div>

        <div className="quantum-bubble bubble-18">
          |1⟩
        </div>

      </div>


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="app-header">

        <div className="brand-area">
          <div className="brand-name">
            QURIO
          </div>

          <div className="brand-subtitle">
            Quantum Circuit Builder
          </div>
        </div>


        <div className="header-illustration">

          <svg
            className="header-stickman"
            viewBox="0 0 170 125"
          >

            <circle
              cx="48"
              cy="30"
              r="15"
              className="stick-head"
            />

            <circle
              cx="43"
              cy="28"
              r="2"
            />

            <circle
              cx="53"
              cy="28"
              r="2"
            />

            <path
              d="M43 35 Q48 39 54 35"
              className="stick-line"
            />

            <line
              x1="48"
              y1="45"
              x2="48"
              y2="78"
              className="stick-line"
            />

            <line
              x1="48"
              y1="52"
              x2="27"
              y2="66"
              className="stick-line"
            />

            <line
              x1="48"
              y1="52"
              x2="70"
              y2="61"
              className="stick-line"
            />

            <line
              x1="48"
              y1="78"
              x2="30"
              y2="99"
              className="stick-line"
            />

            <line
              x1="48"
              y1="78"
              x2="68"
              y2="98"
              className="stick-line"
            />

            <path
              d="M23 102 Q48 94 73 102"
              className="stick-seat"
            />

            <circle
              cx="83"
              cy="51"
              r="5"
              className="thought-dot"
            />

            <circle
              cx="94"
              cy="39"
              r="8"
              className="thought-dot"
            />

            <ellipse
              cx="124"
              cy="34"
              rx="35"
              ry="27"
              className="thought-bubble"
            />

            <circle
              cx="124"
              cy="34"
              r="4"
              className="atom-core"
            />

            <ellipse
              cx="124"
              cy="34"
              rx="22"
              ry="8"
              className="atom-orbit"
            />

            <ellipse
              cx="124"
              cy="34"
              rx="22"
              ry="8"
              transform="rotate(60 124 34)"
              className="atom-orbit"
            />

            <ellipse
              cx="124"
              cy="34"
              rx="22"
              ry="8"
              transform="rotate(-60 124 34)"
              className="atom-orbit"
            />

          </svg>

        </div>

      </header>


      {/* ================================================= */}
      {/* THREE MAIN PANELS */}
      {/* ================================================= */}

      <div className="builder">


        {/* ================================================= */}
        {/* GATE PALETTE */}
        {/* ================================================= */}

        <aside className="gate-panel clay-panel">

          <div className="panel-heading">

            <div>
              <span className="eyebrow">
                
              </span>

              <h2>
                Quantum Gates
              </h2>

              <p>
                Drag a gate into the circuit
              </p>
            </div>

          </div>


          <div className="gate-list">

            {["H", "X", "Y", "Z"].map(
              (gate) => (

                <div
                  className={`gate gate-${gate.toLowerCase()}`}
                  key={gate}
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(
                      event,
                      gate
                    )
                  }
                >

                  <div className="gate-letter">
                    {gate}
                  </div>

                  <div className="gate-name">
                    {gateInfo[gate].name}
                  </div>

                  <div className="gate-drag">
                    ⋮⋮
                  </div>

                  <div className="tooltip">

                    <strong>
                      {gateInfo[gate].name}
                    </strong>

                    <p>
                      {gateInfo[gate].explanation}
                    </p>

                    <span>
                      {gateInfo[gate].formula}
                    </span>

                  </div>

                </div>

              )
            )}


            <div
              className="gate gate-cnot"
              draggable
              onDragStart={(event) =>
                handleDragStart(
                  event,
                  "CNOT"
                )
              }
            >

              <div className="cnot-mini">
                ●
                <span />
                ⊕
              </div>

              <div className="gate-name">
                CNOT Gate
              </div>

              <div className="gate-drag">
                ⋮⋮
              </div>


              <div className="tooltip">

                <strong>
                  {gateInfo.CNOT.name}
                </strong>

                <p>
                  {gateInfo.CNOT.explanation}
                </p>

                <span>
                  {gateInfo.CNOT.formula}
                </span>

              </div>

            </div>

          </div>


          {cnotControl && (
            <div className="cnot-message">

              <strong>
                🔗 CNOT selected
              </strong>

              <span>
                Click another qubit in the
                same column to select target.
              </span>

            </div>
          )}


          <div className="gate-cart">

            <svg
              className="cart-stickman"
              viewBox="0 0 235 140"
            >

              <circle
                cx="43"
                cy="28"
                r="14"
                className="stick-head"
              />

              <line
                x1="43"
                y1="42"
                x2="43"
                y2="80"
                className="stick-line"
              />

              <line
                x1="43"
                y1="52"
                x2="70"
                y2="67"
                className="stick-line"
              />

              <line
                x1="43"
                y1="52"
                x2="21"
                y2="65"
                className="stick-line"
              />

              <line
                x1="43"
                y1="80"
                x2="27"
                y2="108"
                className="stick-line"
              />

              <line
                x1="43"
                y1="80"
                x2="59"
                y2="108"
                className="stick-line"
              />

              <path
                d="M72 70 L190 70 L180 108 L82 108 Z"
                className="cart-body"
              />

              <rect
                x="105"
                y="78"
                width="40"
                height="30"
                rx="6"
                className="cart-gate"
              />

              <text
                x="125"
                y="99"
                textAnchor="middle"
                className="cart-text"
              >
                H
              </text>

              <circle
                cx="98"
                cy="116"
                r="8"
                className="cart-wheel"
              />

              <circle
                cx="169"
                cy="116"
                r="8"
                className="cart-wheel"
              />

              <path
                d="M8 126 L215 126"
                className="cart-dashed"
              />

            </svg>

          </div>

        </aside>


        {/* ================================================= */}
        {/* CIRCUIT BUILDER */}
        {/* ================================================= */}

        <main className="circuit-panel clay-panel">

          <div className="circuit-title">

            <div>

              <span className="eyebrow">
               
              </span>

              <h2>
                Circuit Builder
              </h2>

              <p>
                Create your quantum circuit step by step
              </p>

            </div>

          </div>


          {cnotControl && (
            <div className="cnot-active-banner">
              <span className="active-dot" />

              Control selected:
              <strong>
                q₍{cnotControl.qubit}₎
              </strong>

              <span>
                → click a target in column
                {cnotControl.column + 1}
              </span>
            </div>
          )}


          <div className="circuit-board">

            <div className="circuit-column-header">

              <div className="wire-label-header">
                QUBITS
              </div>

              {columns.map(
                (column) => (
                  <div
                    className="column-number"
                    key={column}
                  >
                    {column + 1}
                  </div>
                )
              )}

            </div>


            {qubits.map(
              (qubit) => (

                <div
                  className="qubit-row"
                  key={qubit}
                >

                  <div className="qubit-label">
                    q₍{qubit}₎
                  </div>


                  <div className="wire-area">

                    {columns.map(
                      (column) => {

                        const key =
                          `${qubit}-${column}`;

                        const gate =
                          circuit[key];

                        const isCnotControl =
                          cnotControl &&
                          cnotControl.qubit ===
                            qubit &&
                          cnotControl.column ===
                            column;

                        const partner =
                          getCnotPartner(
                            column,
                            qubit
                          );

                        const isControl =
                          gate ===
                          "CONTROL";

                        const isTarget =
                          gate ===
                          "TARGET";

                        const distance =
                          partner !==
                          undefined
                            ? Math.abs(
                                partner -
                                  qubit
                              ) * 88
                            : 0;

                        return (
                          <div
                            className={`circuit-cell ${
                              isCnotControl
                                ? "cnot-select-cell"
                                : ""
                            }`}
                            key={column}
                            onDragOver={
                              allowDrop
                            }
                            onDrop={(
                              event
                            ) =>
                              handleDrop(
                                event,
                                qubit,
                                column
                              )
                            }
                            onClick={() => {

                              if (
                                cnotControl
                              ) {
                                handleCnotTarget(
                                  qubit,
                                  column
                                );
                              }

                            }}
                          >

                            {!gate &&
                              !isCnotControl && (
                                <div className="drop-dot">
                                  +
                                </div>
                              )}


                            {gate &&
                              !isControl &&
                              !isTarget && (

                                <div
                                  className={`placed-gate placed-${gate.toLowerCase()}`}
                                  onDoubleClick={() =>
                                    removeGate(
                                      qubit,
                                      column
                                    )
                                  }
                                  title="Double-click to remove"
                                >
                                  {gate}
                                </div>

                              )}


                            {isControl && (

                              <div
                                className="cnot-control"
                                onDoubleClick={() =>
                                  removeGate(
                                    qubit,
                                    column
                                  )
                                }
                                title="Double-click to remove CNOT"
                              >

                                <span className="control-dot">
                                  ●
                                </span>


                                {partner !==
                                  undefined && (
                                  <span
                                    className={`cnot-connector ${
                                      partner >
                                      qubit
                                        ? "connector-down"
                                        : "connector-up"
                                    }`}
                                    style={{
                                      "--cnot-distance":
                                        `${distance}px`,
                                    }}
                                  />
                                )}

                              </div>

                            )}


                            {isTarget && (

                              <div
                                className="cnot-target"
                                onDoubleClick={() =>
                                  removeGate(
                                    qubit,
                                    column
                                  )
                                }
                                title="Double-click to remove CNOT"
                              >
                                ⊕
                              </div>

                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              )
            )}

          </div>


          {/* ================================================= */}
          {/* QUANTUM GUIDE */}
          {/* ================================================= */}

          <div className="quantum-guide">

            <svg
              className="guide-stickman"
              viewBox="0 0 95 125"
            >

              <circle
                cx="40"
                cy="25"
                r="14"
                className="stick-head"
              />

              <circle
                cx="35"
                cy="23"
                r="2"
              />

              <circle
                cx="45"
                cy="23"
                r="2"
              />

              <path
                d="M35 30 Q40 34 46 30"
                className="stick-line"
              />

              <line
                x1="40"
                y1="39"
                x2="40"
                y2="78"
                className="stick-line"
              />

              <line
                x1="40"
                y1="50"
                x2="70"
                y2="44"
                className="stick-line"
              />

              <line
                x1="70"
                y1="44"
                x2="82"
                y2="38"
                className="stick-line"
              />

              <line
                x1="40"
                y1="50"
                x2="20"
                y2="63"
                className="stick-line"
              />

              <line
                x1="40"
                y1="78"
                x2="24"
                y2="108"
                className="stick-line"
              />

              <line
                x1="40"
                y1="78"
                x2="58"
                y2="108"
                className="stick-line"
              />

            </svg>


            <div className="guide-icon">
              ⚛
            </div>

            <div className="guide-content">

              <div className="guide-label">
                QUANTUM GUIDE
              </div>

              <h3>
                {guide.title}
              </h3>

              <p>
                {guide.message}
              </p>

              <div className="guide-tip">
                {guide.tip}
              </div>

            </div>

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* ================================================= */}
          {/* QUANTUM LEARNING CLOUDS */}
          {/* ================================================= */}

          <div className="quantum-learning-section">

            <div className="learning-heading">

              <span className="learning-eyebrow">
              
              </span>

          
            </div>


            {/* ================================================= */}
            {/* CLOUD BUTTONS */}
            {/* ================================================= */}

            <div className="learning-clouds">


              {/* ENTANGLEMENT CLOUD */}

              <button
                type="button"
                className={`learning-cloud entanglement-cloud ${
                  learningOpen === "entanglement"
                    ? "cloud-active"
                    : ""
                }`}
                onClick={() =>
                  toggleLearning("entanglement")
                }
              >

                <span className="cloud-icon">
                  🔗
                </span>

                <span className="cloud-text">

                  <strong>
                    Quantum Entanglement
                  </strong>


                </span>

                <span className="cloud-arrow">
                  {learningOpen === "entanglement"
                   }
                </span>

              </button>


              {/* BELL STATE CLOUD */}

              <button
                type="button"
                className={`learning-cloud bell-cloud ${
                  learningOpen === "bell"
                    ? "cloud-active"
                    : ""
                }`}
                onClick={() =>
                  toggleLearning("bell")
                }
              >

                <span className="cloud-icon">
                  ✨
                </span>

                <span className="cloud-text">

                  <strong>
                    Bell State
                  </strong>

                

                </span>

                <span className="cloud-arrow">
                  {learningOpen === "bell"
                    }
                </span>

              </button>


              {/* CONNECTION CLOUD */}

              <button
                type="button"
                className={`learning-cloud connection-cloud ${
                  learningOpen === "connection"
                    ? "cloud-active"
                    : ""
                }`}
                onClick={() =>
                  toggleLearning("connection")
                }
              >

                <span className="cloud-icon">
                  ⚛
                </span>

                <span className="cloud-text">

                  <strong>
                    How They Connect
                  </strong>


                </span>

                <span className="cloud-arrow">
                  {learningOpen === "connection"
                    }
                </span>

              </button>

            </div>


            {/* ================================================= */}
            {/* ENTANGLEMENT INFORMATION */}
            {/* ================================================= */}

            {learningOpen === "entanglement" && (

              <div className="learning-popup entanglement-popup">

                <div className="learning-popup-header">

                  <div className="popup-icon">
                    🔗
                  </div>

                  <div>
                    <span className="learning-tag">
                      STEP 1
                    </span>

                    <h3>
                      What is Quantum Entanglement?
                    </h3>
                  </div>

                  <button
                    type="button"
                    className="learning-close"
                    onClick={() =>
                      setLearningOpen(null)
                    }
                  >
                    ×
                  </button>

                </div>


                <p>
                  Imagine you have two magical coins.
                  You take one coin to one room and your
                  friend takes the other coin to another room.
                  Even though the coins are far apart,
                  their results are connected.
                </p>

                <p>
                  When you check one quantum particle,
                  you can learn something about the other
                  particle. The two particles behave like
                  they are part of one shared quantum system.
                </p>


                <div className="child-example">

                  <strong>
                    🧒 Easy example:
                  </strong>

                  <span>
                    Think of two magic boxes. When you open
                    one and discover a result, you instantly
                    know what kind of result the other box
                    must have.
                  </span>

                </div>


                <div className="learning-highlight">

                  <strong>
                    Remember:
                  </strong>

                  Entanglement means two qubits can become
                  strongly connected so that their quantum
                  states must be described together.

                </div>

              </div>

            )}


            {/* ================================================= */}
            {/* BELL STATE INFORMATION */}
            {/* ================================================= */}

            {learningOpen === "bell" && (

              <div className="learning-popup bell-popup">

                <div className="learning-popup-header">

                  <div className="popup-icon">
                    ✨
                  </div>

                  <div>

                    <span className="learning-tag">
                      STEP 2
                    </span>

                    <h3>
                      What is a Bell State?
                    </h3>

                  </div>

                  <button
                    type="button"
                    className="learning-close"
                    onClick={() =>
                      setLearningOpen(null)
                    }
                  >
                    ×
                  </button>

                </div>


                <p>
                  A Bell state is a special quantum state
                  made using two qubits that are entangled
                  with each other.
                </p>

                <p>
                  One simple Bell state is:
                </p>


                <div className="bell-formula">
                  |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
                </div>


                <p>
                  This means that when we measure the two
                  qubits, we can get <strong>00</strong> or
                  <strong> 11</strong>. These results appear
                  together because the qubits are entangled.
                </p>


                <div className="child-example">

                  <strong>
                    🧒 Easy example:
                  </strong>

                  <span>
                    Imagine two magic lights. They are
                    prepared together so that whenever you
                    check them, they give matching results:
                    both OFF or both ON.
                  </span>

                </div>


                <div className="learning-highlight">

                  <strong>
                    Remember:
                  </strong>

                  A Bell state is one of the simplest and
                  most important examples of quantum
                  entanglement.

                </div>

              </div>

            )}


            {/* ================================================= */}
            {/* CONNECTION INFORMATION */}
            {/* ================================================= */}

            {learningOpen === "connection" && (

              <div className="learning-popup connection-popup">

                <div className="learning-popup-header">

                  <div className="popup-icon">
                    ⚛
                  </div>

                  <div>

                    <span className="learning-tag">
                      STEP 3
                    </span>

                    <h3>
                      How are Entanglement & Bell States connected?
                    </h3>

                  </div>

                  <button
                    type="button"
                    className="learning-close"
                    onClick={() =>
                      setLearningOpen(null)
                    }
                  >
                    ×
                  </button>

                </div>


                <p>
                  <strong>Entanglement</strong> is the
                  special connection between quantum
                  particles, while a <strong>Bell state</strong>
                  is a specific quantum state that
                  demonstrates this connection.
                </p>


                <div className="connection-steps">


                  <div className="connection-step">

                    <span>
                      1
                    </span>

                    <p>
                      Start with two qubits.
                    </p>

                  </div>


                  <div className="connection-step">

                    <span>
                      2
                    </span>

                    <p>
                      Put the first qubit into superposition
                      using an H gate.
                    </p>

                  </div>


                  <div className="connection-step">

                    <span>
                      3
                    </span>

                    <p>
                      Connect the two qubits using a CNOT gate.
                    </p>

                  </div>


                  <div className="connection-step">

                    <span>
                      4
                    </span>

                    <p>
                      The two qubits become entangled.
                    </p>

                  </div>


                  <div className="connection-step">

                    <span>
                      5
                    </span>

                    <p>
                      You have created a Bell state such
                      as |Φ⁺⟩.
                    </p>

                  </div>

                </div>


                <div className="circuit-learning-note">

                  💡 <strong>Try it in your Circuit Builder:</strong>

                  <br />

                  Put an
                  <strong> H gate </strong>
                  on q₀, then create a
                  <strong> CNOT </strong>
                  between q₀ and q₁.

                  <br />

                  Then click
                  <strong> Run Circuit </strong>
                  and look at the measurement results!

                </div>

              </div>

            )}

          </div>

        </main>


        {/* ================================================= */}
        {/* SIMULATION */}
        {/* ================================================= */}

        <aside className="simulation-panel clay-panel">

          <div className="simulation-heading">

            <span className="eyebrow">
              
            </span>

            <h2>
              Simulation
            </h2>

            <p>
              Explore what your circuit does
            </p>

          </div>


          <div className="circuit-actions">
  <button className="run-button" onClick={runCircuit}>
    ▶ Run Circuit
  </button>

  <button className="reset-button" onClick={resetCircuit}>
    ↻ Reset
  </button>
</div>


          {!results &&
            !running &&
            !error && (

              <div className="simulation-empty">

                <div className="empty-orbit">
                  ⚛
                </div>

                <strong>
                  Ready to simulate
                </strong>

                <span>
                  Build your circuit and press
                  Run Circuit.
                </span>

              </div>
            )}


          {running && (

            <div className="simulation-loading">

              <div className="loading-spinner" />

              <strong>
                Simulating quantum state...
              </strong>

              <span>
                Your circuit is being processed.
              </span>

            </div>
          )}


          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          {results && (

            <div className="simulation-results">

              <div className="results-success">
                ✓ Simulation complete
              </div>


              {/* ================================================= */}
              {/* MEASUREMENT */}
              {/* ================================================= */}

              <div
                className={`simulation-section ${
                  expandedSection ===
                  "measurement"
                    ? "expanded"
                    : ""
                }`}
              >

                <button
                  className="simulation-section-header"
                  onClick={() =>
                    toggleSection(
                      "measurement"
                    )
                  }
                >

                  <div>
                    <span className="section-icon measurement-icon">
                      ◉
                    </span>

                    <span>
                      Measurement
                    </span>
                  </div>

                  <span className="expand-arrow">
                    {expandedSection ===
                    "measurement"
                      ? "−"
                      : "+"}
                  </span>

                  <div className="simulation-tooltip">
                    Shows how many times each quantum state was measured and its percentage of the total measurements.
                  </div>

                </button>


                {expandedSection ===
                  "measurement" && (

                  <div className="simulation-section-body">

                    <p className="section-description">
                      Results from 1024 quantum measurements
                    </p>


                    <div className="result-list">

                      {Object.entries(
                        results.counts || {}
                      ).map(
                        (
                          [state, count],
                          index
                        ) => {

                          const totalShots =
                            Object.values(
                              results.counts || {}
                            ).reduce(
                              (sum, value) =>
                                sum +
                                Number(value),
                              0
                            ) || 1024;

                          const percentage =
                            (Number(count) /
                              totalShots) *
                            100;

                          return (

                            <div
                              className="result-row"
                              key={state}
                            >

                              <span className="state-ket">
                                |{state}⟩
                              </span>

                              <div className="result-bar-container">

                                <div
                                  className={`result-bar result-color-${index % 6}`}
                                  style={{
                                    width:
                                      `${Math.min(
                                        percentage,
                                        100
                                      )}%`,
                                  }}
                                />

                              </div>

                              <div className="measurement-values">

                                <strong>
                                  {count}
                                </strong>

                                <span className="measurement-percent">
                                  {percentage.toFixed(1)}%
                                </span>

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              </div>


              {/* ================================================= */}
              {/* HISTOGRAM */}
              {/* ================================================= */}

              <div
                className={`simulation-section ${
                  expandedSection ===
                  "histogram"
                    ? "expanded"
                    : ""
                }`}
              >

                <button
                  className="simulation-section-header"
                  onClick={() =>
                    toggleSection(
                      "histogram"
                    )
                  }
                >

                  <div>
                    <span className="section-icon histogram-icon">
                      ▥
                    </span>

                    <span>
                      Histogram
                    </span>
                  </div>

                  <span className="expand-arrow">
                    {expandedSection ===
                    "histogram"
                      ? "−"
                      : "+"}
                  </span>

                  <div className="simulation-tooltip">
                    Visualizes the probability of measuring each possible quantum state.
                  </div>

                </button>


                {expandedSection ===
                  "histogram" && (

                  <div className="simulation-section-body">

                    <p className="section-description">
                      Probability of measuring each quantum state
                    </p>


                    <div className="histogram-chart">

                      {Object.entries(
                        results.probabilities ||
                        {}
                      ).map(
                        (
                          [state, probability],
                          index
                        ) => {

                          const percentage =
                            Number(
                              probability
                            ) <= 1
                              ? Number(
                                  probability
                                ) * 100
                              : Number(
                                  probability
                                );

                          const barHeight =
                            Math.max(
                              Math.min(
                                percentage,
                                100
                              ) * 2.15,
                              5
                            );

                          return (

                            <div
                              className="histogram-column"
                              key={state}
                            >

                              <div className="histogram-value">
                                {percentage.toFixed(
                                  1
                                )}
                                %
                              </div>

                              <div className="histogram-bar-area">

                                <div
                                  className={`histogram-bar histogram-color-${index % 6}`}
                                  style={{
                                    height:
                                      `${barHeight}px`,
                                  }}
                                />

                              </div>

                              <div className="histogram-label">
                                |{state}⟩
                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              </div>


              {/* ================================================= */}
              {/* STATEVECTOR */}
              {/* ================================================= */}

              <div
                className={`simulation-section ${
                  expandedSection ===
                  "statevector"
                    ? "expanded"
                    : ""
                }`}
              >

                <button
                  className="simulation-section-header"
                  onClick={() =>
                    toggleSection(
                      "statevector"
                    )
                  }
                >

                  <div>
                    <span className="section-icon statevector-icon">
                      ψ
                    </span>

                    <span>
                      Statevector
                    </span>
                  </div>

                  <span className="expand-arrow">
                    {expandedSection ===
                    "statevector"
                      ? "−"
                      : "+"}
                  </span>

                  <div className="simulation-tooltip">
                    Displays the probability amplitudes that completely describe the quantum state after the gates are applied.
                  </div>

                </button>


                {expandedSection ===
                  "statevector" && (

                  <div className="simulation-section-body">

                    <p className="section-description">
                      Quantum state amplitudes after applying the gates
                    </p>


                    <div className="statevector-list">

                      {results.statevector &&
                        results.statevector.map(
                          (
                            amplitude,
                            index
                          ) => {

                            const binaryState =
                              index
                                .toString(2)
                                .padStart(
                                  3,
                                  "0"
                                );

                            const real =
                              Number(
                                amplitude.real ??
                                  0
                              );

                            const imaginary =
                              Number(
                                amplitude.imaginary ??
                                  0
                              );

                            return (

                              <div
                                className="statevector-row"
                                key={index}
                              >

                                <span className="state-label">
                                  |{binaryState}⟩
                                </span>

                                <span className="amplitude">

                                  {formatNumber(
                                    real
                                  )}

                                  {" "}

                                  {imaginary >=
                                  0
                                    ? "+"
                                    : "−"}

                                  {" "}

                                  {formatNumber(
                                    Math.abs(
                                      imaginary
                                    )
                                  )}

                                  i

                                </span>

                              </div>

                            );
                          }
                        )}

                    </div>

                  </div>
                )}

              </div>


              {/* ================================================= */}
              {/* BLOCH SPHERE */}
              {/* ================================================= */}

              <div
                className={`simulation-section bloch-simulation-section ${
                  expandedSection ===
                  "bloch"
                    ? "expanded"
                    : ""
                }`}
              >

                <button
                  className="simulation-section-header"
                  onClick={() =>
                    toggleSection(
                      "bloch"
                    )
                  }
                >

                  <div>
                    <span className="section-icon bloch-icon">
                      ◉
                    </span>

                    <span>
                      Bloch Sphere
                    </span>
                  </div>

                  <span className="expand-arrow">
                    {expandedSection ===
                    "bloch"
                      ? "−"
                      : "+"}
                  </span>

                  <div className="simulation-tooltip">
                    Shows the state of each individual qubit as a vector on the Bloch sphere using its X, Y and Z components.
                  </div>

                </button>


                {expandedSection ===
                  "bloch" && (

                  <div className="simulation-section-body bloch-body">

                    <p className="section-description">
                      Single-qubit state visualization using the reduced Bloch vector
                    </p>


                    <div className="bloch-container">

                      {qubits.map(
                        (qubit) => {

                          const vector =
                            blochVectors[
                              qubit
                            ];

                          const projection =
                            getBlochProjection(
                              vector
                            );

                          const magnitude =
                            Math.sqrt(
                              vector.x ** 2 +
                              vector.y ** 2 +
                              vector.z ** 2
                            );

                          return (

                            <div
                              className="bloch-card"
                              key={qubit}
                            >

                              <h4>
                                Qubit q₍{qubit}₎
                              </h4>


                              <div className="bloch-sphere">

                                <div className="sphere-equator" />
                                <div className="sphere-meridian" />
                                <div className="sphere-inner-meridian" />


                                <div className="bloch-axis x-axis">

                                  <span className="axis-positive">
                                    +X
                                  </span>

                                  <span className="axis-negative">
                                    −X
                                  </span>

                                </div>


                                <div className="bloch-axis y-axis">

                                  <span className="axis-positive">
                                    +Y
                                  </span>

                                  <span className="axis-negative">
                                    −Y
                                  </span>

                                </div>


                                <div className="bloch-axis z-axis">

                                  <span className="axis-positive">
                                    |0⟩
                                  </span>

                                  <span className="axis-negative">
                                    |1⟩
                                  </span>

                                </div>


                                <div
                                  className="bloch-vector"
                                  style={{
                                    width:
                                      `${Math.max(
                                        Math.sqrt(
                                          projection.x ** 2 +
                                          projection.y ** 2
                                        ),
                                        2
                                      )}px`,

                                    transform:
                                      `rotate(${Math.atan2(
                                        projection.y,
                                        projection.x
                                      ) * 180 / Math.PI}deg)`,
                                  }}
                                >

                                  <span className="vector-arrow" />

                                  <span className="vector-point" />

                                </div>


                                <div className="sphere-center" />

                              </div>


                              <div className="bloch-values">

                                <div className="bloch-value x-value">

                                  <small>
                                    X
                                  </small>

                                  <strong>
                                    {vector.x.toFixed(
                                      3
                                    )}
                                  </strong>

                                </div>


                                <div className="bloch-value y-value">

                                  <small>
                                    Y
                                  </small>

                                  <strong>
                                    {vector.y.toFixed(
                                      3
                                    )}
                                  </strong>

                                </div>


                                <div className="bloch-value z-value">

                                  <small>
                                    Z
                                  </small>

                                  <strong>
                                    {vector.z.toFixed(
                                      3
                                    )}
                                  </strong>

                                </div>

                              </div>


                              <div className="bloch-magnitude">

                                |r| ={" "}

                                {magnitude.toFixed(
                                  3
                                )}

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              </div>


              {/* ================================================= */}
              {/* EXTRA DETAILS */}
              {/* ================================================= */}

              <details className="extra-details">

                <summary>
                  View simulated circuit
                </summary>

                <pre>
                  {results.circuit}
                </pre>

              </details>


              <details className="extra-details">

                <summary>
                  View Qiskit Code
                </summary>

                <pre>
                  {generateQiskitCode()}
                </pre>

              </details>

            </div>

          )}

        </aside>

      </div>

    </div>
  );
}

export default App;