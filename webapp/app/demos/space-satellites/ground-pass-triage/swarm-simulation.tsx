"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

const phases = [
  {
    time: "T+00:00",
    title: "NOMINAL SWARM",
    detail: "Twelve members share health, relative-state, and workload summaries over the crosslink mesh.",
    event: "All members inside their assigned operating envelopes.",
    risk: 8,
    coverage: 100,
    state: "NOMINAL",
  },
  {
    time: "T+00:18",
    title: "TELEMETRY DIVERGENCE",
    detail: "SAT-07 reports delayed ADCS acknowledgements and rising reaction-wheel momentum.",
    event: "Deterministic FDIR remains in control; decision avionics enters watch mode.",
    risk: 24,
    coverage: 100,
    state: "WATCH",
  },
  {
    time: "T+00:32",
    title: "RELATIVE-STATE ALERT",
    detail: "The flight-dynamics service predicts that SAT-07 will leave its permitted relative-motion envelope.",
    event: "Only prevalidated responses are passed to the decision layer.",
    risk: 72,
    coverage: 96,
    state: "CONJUNCTION REVIEW",
  },
  {
    time: "T+00:34",
    title: "DECISION AVIONICS",
    detail: "The bounded choice is safe-drift alpha, hold and observe, or operator investigation.",
    event: "Synthetic replay selects SAFE-DRIFT ALPHA; the live panel below can compare D1 and JEV.",
    risk: 61,
    coverage: 96,
    state: "GUIDANCE READY",
  },
  {
    time: "T+00:48",
    title: "ISOLATE + REDISTRIBUTE",
    detail: "A simulated supervisor authorizes the predefined drift option. SAT-06 and SAT-08 absorb its queued work.",
    event: "SAT-07 leaves the formation envelope; command authority remains deterministic and supervised.",
    risk: 31,
    coverage: 92,
    state: "SAFE DRIFT",
  },
  {
    time: "T+02:10",
    title: "RECOVERY CHECKS",
    detail: "SAT-07 reboots into a constrained mode while the swarm continues without its payload contribution.",
    event: "Rejoin remains blocked until health, navigation, and communications checks pass.",
    risk: 18,
    coverage: 94,
    state: "RECOVERING",
  },
  {
    time: "T+08:00",
    title: "DISPOSITION",
    detail: "The member is stable, but rejoin requires three nominal checkpoints and operator approval.",
    event: "Terminal disposal is not triggered; a catastrophic branch would initiate deorbit review only.",
    risk: 10,
    coverage: 99,
    state: "REJOIN REVIEW",
  },
];

const members = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
  return {
    id: `SAT-${String(index + 1).padStart(2, "0")}`,
    x: 50 + Math.cos(angle) * 39,
    y: 50 + Math.sin(angle) * 39,
  };
});

export function SwarmSimulation() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const phase = phases[phaseIndex];

  useEffect(() => {
    if (!playing) return;
    if (phaseIndex >= phases.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setPhaseIndex((current) => current + 1), 1900);
    return () => window.clearTimeout(timer);
  }, [phaseIndex, playing]);

  const eventLog = useMemo(() => phases.slice(0, phaseIndex + 1).reverse(), [phaseIndex]);

  function restart() {
    setPhaseIndex(0);
    setPlaying(true);
  }

  return (
    <section className="swarm-sim" aria-labelledby="swarm-sim-title">
      <div className="swarm-sim-toolbar">
        <div><span className="log-kicker">01 / SCRIPTED INCIDENT</span><h2 id="swarm-sim-title">SWARM GUARDIAN</h2></div>
        <div className="sim-controls">
          <Button type="button" variant="ghost" onClick={restart} aria-label="Restart scenario"><RotateCcw size={15} /></Button>
          <Button type="button" variant="ghost" onClick={() => setPhaseIndex((current) => Math.max(0, current - 1))} disabled={phaseIndex === 0} aria-label="Previous phase"><ChevronLeft size={16} /></Button>
          <Button type="button" onClick={() => setPlaying((current) => !current)} className="sim-play">{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "PAUSE" : "PLAY"}</Button>
          <Button type="button" variant="ghost" onClick={() => setPhaseIndex((current) => Math.min(phases.length - 1, current + 1))} disabled={phaseIndex === phases.length - 1} aria-label="Next phase"><ChevronRight size={16} /></Button>
        </div>
      </div>

      <div className="swarm-sim-grid">
        <div className="orbit-console">
          <div className="orbit-meta"><span>LEO / SUN-SYNCHRONOUS</span><span>12 MEMBERS</span><span>SYNTHETIC REPLAY</span></div>
          <div className="orbit-stage" aria-label={`Swarm state: ${phase.state}`}>
            <div className="orbit-ring orbit-ring-outer" />
            <div className="orbit-ring orbit-ring-inner" />
            <div className="earth-node"><span>SWARM</span><strong>CTRL</strong></div>
            {phaseIndex >= 2 && <div className="risk-vector"><span>RELATIVE-STATE ALERT</span></div>}
            {members.map((member, index) => {
              const affected = index === 6;
              const supporting = phaseIndex >= 4 && (index === 5 || index === 7);
              const isolated = affected && phaseIndex >= 4;
              const style = {
                left: `${member.x}%`,
                top: `${member.y}%`,
                "--drift-x": isolated ? "34px" : "0px",
                "--drift-y": isolated ? "-22px" : "0px",
              } as CSSProperties;
              return (
                <div className={`sat-node ${affected && phaseIndex >= 1 ? "sat-watch" : ""} ${isolated ? "sat-isolated" : ""} ${supporting ? "sat-support" : ""}`} style={style} key={member.id}>
                  <i /><span>{member.id}</span>
                </div>
              );
            })}
          </div>
          <div className="orbit-legend"><span><i className="legend-nominal" /> NOMINAL</span><span><i className="legend-watch" /> AFFECTED</span><span><i className="legend-support" /> WORKLOAD ASSIGNED</span></div>
        </div>

        <div className="incident-console">
          <div className="incident-phase"><span>{phase.time} / PHASE {phaseIndex + 1} OF {phases.length}</span><strong>{phase.title}</strong><p>{phase.detail}</p></div>
          <div className="sim-metrics">
            <div><span>SWARM RISK</span><strong>{phase.risk}%</strong><i><b style={{ width: `${phase.risk}%` }} /></i></div>
            <div><span>MISSION COVERAGE</span><strong>{phase.coverage}%</strong><i><b style={{ width: `${phase.coverage}%` }} /></i></div>
            <div><span>DECISION STATE</span><strong>{phase.state}</strong></div>
          </div>
          <div className="incident-event"><span>CURRENT EVENT</span><p>{phase.event}</p></div>
          <div className="incident-log" role="log" aria-live="polite">
            {eventLog.map((item) => <button type="button" onClick={() => setPhaseIndex(phases.indexOf(item))} key={item.time}><time>{item.time}</time><span>{item.title}</span></button>)}
          </div>
        </div>
      </div>

      <div className="sim-progress" aria-label="Scenario progress">
        {phases.map((item, index) => <button type="button" onClick={() => { setPhaseIndex(index); setPlaying(false); }} className={index === phaseIndex ? "active" : index < phaseIndex ? "complete" : ""} key={item.time}><i /><span>{item.title}</span></button>)}
      </div>
    </section>
  );
}
