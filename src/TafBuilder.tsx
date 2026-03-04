import { useState } from "react";
import ChangeEditor from "./components/ChangeEditor";
import IssueTimeInput from "./components/IssueTimeInput";
import Timeline from "./components/Timeline";
import type { TAF, TAFChange } from "./types/taf";
import { addTempo, generateTAF } from "./utils/taf";
import { getBaseForecastPeriod, getCurrentIssueTimeUTC, getTimelineStartHour } from "./utils/time";
import { createCloudLayer, emptyWeather } from "./utils/weather";

export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>({
    station: "",
    issueTime: getCurrentIssueTimeUTC(),
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: [],
  });

  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const timelineStartHour = getTimelineStartHour(taf.issueTime);
  const basePeriod = getBaseForecastPeriod(taf.issueTime);

  function handleSelectRange(from: number, to: number) {
    const result = addTempo(taf, from, to);
    setTaf(result.taf);
    setSelectedChangeIndex(result.index);
  }

  function updateChange(index: number | null, updatedChange: TAFChange) {
    if (index === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes[index] = updatedChange;
      return { ...prev, changes };
    });
  }

  function handleDelete() {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes.splice(selectedChangeIndex, 1);
      return { ...prev, changes };
    });
    setSelectedChangeIndex(null);
  }

  function handleChangeType(type: "BECMG" | "FM" | "TEMPO") {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      const change = changes[selectedChangeIndex];
      changes[selectedChangeIndex] = { ...change, type };
      return { ...prev, changes };
    });
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">TAF Visual Builder</h1>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Header</h2>
        <input
          value={taf.station}
          onChange={(e) => setTaf((prev) => ({ ...prev, station: e.target.value }))}
          className="border p-1 mr-2 rounded-xl w-30"
          placeholder="ICAO Code"
        />
        <IssueTimeInput
          value={taf.issueTime}
          onChange={(val) => setTaf((prev) => ({ ...prev, issueTime: val }))}
        />
      </section>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Base Forecast</h2>
        <ChangeEditor
          change={{
            from: basePeriod.from,
            to: basePeriod.to,
            state: {
              ...taf.base,
              clouds:
                taf.base.clouds && taf.base.clouds.length > 0
                  ? taf.base.clouds
                  : [createCloudLayer({ amount: "FEW", height: 0 })],
              enabledBlocks: { wind: true, vis: true, clouds: true },
            },
          }}
          onUpdate={(updated) =>
            setTaf((prev) => ({
              ...prev,
              base: {
                ...updated.state,
                clouds:
                  updated.state.clouds && updated.state.clouds.length > 0
                    ? updated.state.clouds
                    : [createCloudLayer({ amount: "FEW", height: 0 })],
                enabledBlocks: undefined,
              },
            }))
          }
        />
      </section>

      <section className="p-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold mb-0">Timeline</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-yellow-300 rounded-sm border border-black" />
              <span className="text-xs">TEMPO</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-300 rounded-sm border border-black" />
              <span className="text-xs">BECMG</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-orange-300 rounded-sm border border-black" />
              <span className="text-xs">FM</span>
            </div>
          </div>
        </div>

        <Timeline
          changes={taf.changes}
          startHour={timelineStartHour}
          onSelectRange={handleSelectRange}
          onSelectChange={(index) => {
            setSelectedChangeIndex((prev) => (prev === index ? null : index));
          }}
        />
      </section>

      {selectedChangeIndex !== null && (
        <section className="p-4 rounded-xl">
          <h2 className="font-semibold">Selected Change</h2>
          <div>
            <ChangeEditor
              key={selectedChangeIndex}
              change={taf.changes[selectedChangeIndex]}
              onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
              showActionButtons
              onDelete={handleDelete}
              onChangeType={handleChangeType}
            />
          </div>
        </section>
      )}

      <section className="p-4 rounded">
        <h2 className="font-semibold">Generated TAF</h2>
        <pre className="whitespace-pre-wrap text-sm bg-black text-green-400 p-3 rounded-xl">
          {generateTAF(taf)}
        </pre>
      </section>
    </div>
  );
}
