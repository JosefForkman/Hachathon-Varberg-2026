const SHARE_URL =
    typeof window !== "undefined"
        ? window.location.origin
        : "https://s-halland.app";
const SHARE_TEXT =
    "Just discovered S- Halland — a live map tracking the health of Halland's protected areas with biodiversity, climate, and ecosystem scores. Built on open data from Naturvårdsverket + SMHI. Worth a look if you care about conservation 🌿";

export default function ShareButton() {
    function onShare() {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}&summary=${encodeURIComponent(SHARE_TEXT)}`;
        window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
    }

    return (
        <button
            className="btn btn--linkedin"
            onClick={onShare}
            aria-label="Share on LinkedIn">
            <svg
                className="btn__icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
            </svg>
            Share on LinkedIn
        </button>
    );
}
