import { useEffect, useState, useCallback } from "react";
import {
    sendCallback,
    onInit,
    notify,
    close,
    type PlayerInfo,
    type CallbackResult,
} from "./mphone";

interface CounterResult extends CallbackResult {
    count?: number;
}

export default function App() {
    const [ready, setReady] = useState(false);
    const [player, setPlayer] = useState<PlayerInfo | null>(null);
    const [count, setCount] = useState(0);
    const [pulse, setPulse] = useState(false);

    const pulseCounter = useCallback(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 150);
    }, []);

    const apply = useCallback((r: CounterResult) => {
        if (r?.success && typeof r.count === "number") {
            setCount(r.count);
            pulseCounter();
        }
    }, [pulseCounter]);

    const increment = useCallback(async () => {
        apply(await sendCallback<CounterResult>("increment"));
    }, [apply]);

    const decrement = useCallback(async () => {
        apply(await sendCallback<CounterResult>("decrement"));
    }, [apply]);

    const reset = useCallback(async () => {
        apply(await sendCallback<CounterResult>("reset"));
    }, [apply]);

    const onNotify = useCallback(() => {
        notify("Counter (React TS)", "Current count: " + count);
    }, [count]);

    useEffect(() => {
        onInit(async (p) => {
            setPlayer(p);
            setReady(true);
            const r = await sendCallback<CounterResult>("getCounter");
            if (r?.success && typeof r.count === "number") {
                setCount(r.count);
            }
        });
    }, []);

    if (!ready) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Loading…</p>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <div className="header">
                <h1>Counter</h1>
                <span className="badge">React + TS</span>
            </div>

            <div className="player-info">
                <div className="label">Phone Number</div>
                <div className="value">{player?.phoneNumber || "—"}</div>
            </div>

            <div className="counter-display">
                <div className={"counter-value" + (pulse ? " pulse" : "")}>{count}</div>
                <div className="button-group">
                    <button className="btn btn-decrement" onClick={decrement}>−</button>
                    <button className="btn btn-increment" onClick={increment}>+</button>
                </div>
            </div>

            <div className="actions">
                <button className="action-btn btn-reset" onClick={reset}>Reset</button>
                <button className="action-btn btn-notify" onClick={onNotify}>Notify</button>
                <button className="action-btn btn-close" onClick={close}>Close</button>
            </div>
        </div>
    );
}
