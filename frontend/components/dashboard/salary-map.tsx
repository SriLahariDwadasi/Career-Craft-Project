"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { fetchMapData, MapPoint } from "@/utils/api";
import { useDebounce } from "@/utils/debounce";
import "leaflet/dist/leaflet.css";
import React from "react";
import { LeafletMouseEvent } from "leaflet";
import { CircleMarker as LeafletCircleMarker } from "leaflet"; // important

const MapContainer = dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((m) => m.TileLayer),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import("react-leaflet").then((m) => m.CircleMarker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((m) => m.Popup),
    { ssr: false }
);

export default function SalaryMap() {
    // filters
    const [mode, setMode] = useState<"CITY" | "STATE">("CITY");
    const [minSalary, setMinSalary] = useState(0);
    const [maxSalary, setMaxSalary] = useState(200000);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 5000);

    // data + loading
    const [points, setPoints] = useState<MapPoint[]>([]);
    const [loading, setLoading] = useState(false);

    // fetch on filter change
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchMapData(mode, minSalary, maxSalary, debouncedQuery || undefined)
            .then((data) => {
                if (!cancelled) setPoints(data);
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mode, minSalary, maxSalary, debouncedQuery]);

    // map center/zoom
    const center: [number, number] = [37.8, -96.9];
    const zoom = mode === "CITY" ? 4 : 5;
    const minAvg = points.length ? Math.min(...points.map((p) => p.avgSalary)) : 0;
    const maxAvg = points.length ? Math.max(...points.map((p) => p.avgSalary)) : 0;
    const range = maxAvg - minAvg || 1;

    return (
        <div className="p-4 bg-white/20 backdrop-blur-md border border-gray-400 rounded-xl shadow-md text-white">
            <h2 className="text-3xl font-bold text-indigo-200 mb-5">
                Career Map Explorer
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-6 items-baseline justify-center mb-6">
                {/* Group By */}
                <div className="self-end">
                    <div className="inline-flex mb-[26px] rounded-md bg-gray-700">
                        {["CITY", "STATE"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`
                  px-4 py-2 text-sm font-medium transition cursor-pointer
                  ${mode === m
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-300 hover:bg-gray-600 hover:text-white"}
                  ${m === "CITY" ? "rounded-l-md" : "rounded-r-md"}
                `}
                            >
                                {m.charAt(0) + m.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Salary Range */}
                <div className="flex flex-col">
                    <span className="block mb-1 text-sm text-indigo-200 font-medium">
                        Annual Dollar Salary
                    </span>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            min={0}
                            max={650000}
                            step={1000}
                            value={minSalary}
                            onChange={(e) => setMinSalary(Number(e.target.value))}
                            className="w-24 p-2 bg-white/40 text-white rounded"
                        />
                        <span className="text-indigo-200">to</span>
                        <input
                            type="number"
                            min={0}
                            max={650000}
                            step={1000}
                            value={maxSalary}
                            onChange={(e) => setMaxSalary(Number(e.target.value))}
                            className="w-24 p-2 bg-white/40 text-white rounded"
                        />
                    </div>
                </div>

                {/* Job Title */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block mb-1 text-sm text-indigo-200 font-medium">
                        Search Job Title
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Engineer"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full p-2 placeholder-white bg-white/40 text-white rounded"
                    />
                    <p className="mt-1 text-xs text-white">
                        Searching 5s after you stop typing…
                    </p>
                </div>
            </div>

            {/* Map */}
            <div className="-mt-2 h-[600px] rounded-lg overflow-hidden">
                <MapContainer center={center} zoom={zoom} className="h-full w-full">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    {points.map((p) => {
                        const opacity = (p.avgSalary - minAvg) / range;
                        return (
                            <React.Fragment key={p.name}>
                                {/* Invisible “hit‐area” marker */}
                                <CircleMarker
                                    center={[p.lat, p.lng]}
                                    radius={10}              // <-- larger radius for hover area
                                    pathOptions={{
                                        fillOpacity: 0,        // completely transparent
                                        stroke: false,
                                    }}
                                    eventHandlers={{
                                        mouseover: (e: LeafletMouseEvent) => {
                                            const layer = e.target as LeafletCircleMarker;
                                            layer.openPopup();
                                        },
                                        mouseout: (e: LeafletMouseEvent) => {
                                            const layer = e.target as LeafletCircleMarker;
                                            layer.closePopup();
                                        }
                                    }}
                                >
                                    <Popup>
                                        <strong>{p.name}</strong><br />
                                        ${p.avgSalary.toLocaleString()}
                                    </Popup>
                                </CircleMarker>

                                {/* Actual visible dot */}
                                <CircleMarker
                                    center={[p.lat, p.lng]}
                                    radius={5}
                                    pathOptions={{
                                        fillColor: "#4F46E5",
                                        fillOpacity: opacity,
                                        stroke: false,
                                    }}
                                    interactive={false}      // so events go through to the invisible one
                                />
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
            {/* Status */}
            <div className="mt-2">
                {loading ? (
                    <p className="text-sm text-gray-200">Loading…</p>
                ) : (
                    <p className="text-sm text-indigo-200">
                        Showing {points.length} region
                        {points.length !== 1 && "s"}
                    </p>
                )}
            </div>
        </div>
    );
}
