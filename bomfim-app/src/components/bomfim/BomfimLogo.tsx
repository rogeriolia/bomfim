export function BomfimLogo({ variant = "default" }: { variant?: "default" | "white" | "symbol" }) {
    return variant === "symbol" ? (
        <img className="brand-symbol" src="/brand/bomfim-symbol.jpeg" alt="Bomfim" />
    ) : (
        <span className={`brand-logo ${variant === "white" ? "brand-white" : ""}`}>
            <img src="/brand/bomfim-logo.jpeg" alt="Bomfim" />
        </span>
    );
}
