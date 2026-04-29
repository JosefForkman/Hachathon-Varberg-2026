const SHARE_URL =
    typeof window !== "undefined"
        ? window.location.origin
        : "https://s-halland.app";
const SHARE_TITLE = "S-Halland — Golden Spot Finder";
const SHARE_SUMMARY =
    "A live map for finding sustainable industrial sites in Halland — solar, infrastructure access, and pollution data, with hard exclusion of protected areas. Built on open data from Naturvårdsverket, SMHI, and OSM.";

export default function ShareButton() {
    const href =
        "https://www.linkedin.com/shareArticle?mini=1" +
        `&url=${encodeURIComponent(SHARE_URL)}` +
        `&title=${encodeURIComponent(SHARE_TITLE)}` +
        `&summary=${encodeURIComponent(SHARE_SUMMARY)}`;

    return (
        <a
            href={`https://www.linkedin.com/shareArticle?mini=1&url=${encodeURIComponent(SHARE_URL)}&title=Your%20App%20Title&summary=${encodeURIComponent(SHARE_TEXT)}`}
            target="_blank"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#0077B5",
                color: "white",
                padding: "9px 18px",
                borderRadius: "6px",
                textDecoration: "none",
                fontFamily: "sans-serif",
                fontSize: "14px",
                fontWeight: "500",
            }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
        </a>
        </a>
    );
}
