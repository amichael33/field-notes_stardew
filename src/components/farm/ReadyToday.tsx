import { CROPS, cropById } from "../../data/farm-lookup";
import { harvestSummary } from "../../data/farm";
import type { SeasonDay } from "../../data/calendar";
import type { PlantedCrop } from "../../data/types";
import { useSave } from "../../state/SaveContext";
import ItemIcon from "../ItemIcon";
import HarvestButton from "./HarvestButton";

const label = (date: SeasonDay) =>
  `${date.season[0].toUpperCase()}${date.season.slice(1)} ${date.day}`;

export default function ReadyToday() {
  const { save, updateFarm } = useSave();
  const { ready, tomorrow, seasonOver, coming } = harvestSummary(
    save.farm.crops,
    CROPS,
    save.clock,
  );
  const comingLines = coming.map(({ entry, date, days }) => {
    const name = cropById(entry.crop)?.name ?? entry.crop;
    return {
      id: entry.id,
      text: `${name} ×${entry.count}, ${label(date)} (in ${days} ${days === 1 ? "day" : "days"})`,
    };
  });

  const row = (entry: PlantedCrop, status: string, action: React.ReactNode) => {
    const name = cropById(entry.crop)?.name ?? entry.crop;
    return (
      <li key={entry.id} className="path-row plan-row">
        <span className="row-check">
          <ItemIcon name={name} />
          <span>
            <strong>{status}</strong>
            <span>{` ${entry.count} ${name}`}</span>
          </span>
        </span>
        {action}
      </li>
    );
  };

  return (
    <section className="card">
      <h2>Ready today</h2>
      {(ready.length > 0 || tomorrow.length > 0 || seasonOver.length > 0) && (
        <ul aria-label="Ready today" className="path-list">
          {ready.map((e) => row(e, "Ready now", <HarvestButton entry={e} />))}
          {tomorrow.map((e) => row(e, "Tomorrow", null))}
          {seasonOver.map((e) =>
            row(
              e,
              "Died at the season change",
              <button
                type="button"
                className="btn-small no-print"
                aria-label={`Remove ${cropById(e.crop)?.name ?? e.crop}`}
                onClick={() =>
                  updateFarm((f) => ({
                    ...f,
                    crops: f.crops.filter((c) => c.id !== e.id),
                  }))
                }
              >
                Remove
              </button>,
            ),
          )}
        </ul>
      )}
      {ready.length === 0 && tomorrow.length === 0 && (
        <>
          <p>Nothing to harvest today.</p>
          <p className="row-detail">
            {comingLines.length > 0
              ? `Next: ${comingLines[0].text}`
              : "Plant something in Crops planted."}
          </p>
        </>
      )}
      {comingLines.length > 0 && (
        <>
          <h3>Coming up</h3>
          <ul className="path-list">
            {comingLines.map((l) => (
              <li key={l.id}>{l.text}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
