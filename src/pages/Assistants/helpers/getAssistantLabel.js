export const getAssistantLabel = (direction) => {
    if (!direction || !direction.src_token || !direction.dst_token) return "Invalid direction";
    const symbol = direction.type === "expatriation" ? direction.src_token.symbol : direction.dst_token.symbol;
    return `${symbol}: ${direction.src_token.network} -> ${direction.dst_token.network} (${direction.dst_token.network} side)`;
}
