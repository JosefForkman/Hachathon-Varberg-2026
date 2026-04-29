// Decorative floating bubbles around the hero, matching the reference design.
// Pure cosmetic — pointer-events: none, hidden on small screens via CSS.

const ITEMS = [
    { emoji: "🔑", color: "yellow", top: "18%", left: "12%" },
    { emoji: "🌿", color: "green", top: "34%", left: "22%" },
    { emoji: "💧", color: "blue", top: "50%", left: "8%" },
    { emoji: "🦌", color: "lime", top: "14%", right: "18%" },
    { emoji: "🐦", color: "cyan", top: "40%", right: "8%" },
    { emoji: "🍃", color: "pink", top: "60%", right: "14%" },
    { emoji: "🌲", color: "rose", top: "72%", left: "16%" },
    { emoji: "🦋", color: "violet", top: "76%", right: "20%" },
];

export default function FloatingDecorations() {
    return (
        <>
            {ITEMS.map((it, i) => (
                <div
                    key={i}
                    className={`deco deco--${it.color}`}
                    style={{
                        top: it.top,
                        left: it.left,
                        right: it.right,
                        animationDelay: `${i * 0.4}s`,
                    }}
                    aria-hidden>
                    {it.emoji}
                </div>
            ))}
        </>
    );
}
