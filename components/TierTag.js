export default function TierTag({ tier }) {
  return <span className={`tier-tag tier-${tier}`}>{tier}</span>;
}
