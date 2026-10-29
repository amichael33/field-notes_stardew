import {
  bundleItemId,
  bundleItemsBySeason,
  roomRank,
  roomStatus,
} from "../data/selectors";
import { useAppState } from "../state/AppState";
import { useSave } from "../state/SaveContext";
import ItemRow from "../components/ItemRow";
import type { Bundle, BundleItem } from "../data/types";
import bundlesJson from "../data/bundles.json";

export default function BundlesView({
  bundles = bundlesJson as Bundle[],
}: {
  bundles?: Bundle[];
}) {
  const { season } = useAppState();
  const { save } = useSave();
  const route = save.profile.route;

  if (route === "joja") {
    return (
      <section>
        <h1>Community Center</h1>
        <p>Bundles are not used on the Joja route.</p>
      </section>
    );
  }

  const rows = bundleItemsBySeason(bundles, season);
  const grouped = new Map<Bundle, { item: BundleItem; index: number }[]>();
  for (const { bundle, item, index } of rows) {
    grouped.set(bundle, [...(grouped.get(bundle) ?? []), { item, index }]);
  }

  return (
    <section>
      <h1>Community Center</h1>
      {grouped.size === 0 ? (
        <p>No bundle items available this season.</p>
      ) : (
        <div className="cols masonry">
          {[...grouped.entries()]
            .sort(([a], [b]) => {
              const ua = roomStatus(a.room, bundles, save.checked).unlocked ? 0 : 1
              const ub = roomStatus(b.room, bundles, save.checked).unlocked ? 0 : 1
              return ua - ub || roomRank(a.room) - roomRank(b.room)
            })
            .map(([bundle, items]) => {
              const status = roomStatus(bundle.room, bundles, save.checked);
              return (
                <article
                  key={bundle.id}
                  className={
                    status.unlocked
                      ? "card bundle-card"
                      : "card bundle-card locked"
                  }
                >
                  <p
                    className={
                      status.unlocked ? "room-status open" : "room-status"
                    }
                  >
                    {status.unlocked ? "Unlocked" : "Locked"}: {bundle.room}
                    {!status.unlocked && (
                      <span className="when">
                        {" "}
                        {status.hint} You have {status.have} of {status.need}.
                      </span>
                    )}
                  </p>
                  <h2>
                    {bundle.name}{" "}
                    <span className="when">
                      {bundle.room}, reward: {bundle.reward}
                    </span>
                  </h2>
                  <p className="when">
                    Fill {bundle.slotsRequired} of {bundle.items.length} slots
                  </p>
                  <ul className="item-list">
                    {items.map(({ item, index }) => (
                      <li key={bundleItemId(bundle, item, index)}>
                        <ItemRow
                          bundle={bundle}
                          item={item}
                          index={index}
                          showSource
                        />
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
        </div>
      )}
    </section>
  );
}
