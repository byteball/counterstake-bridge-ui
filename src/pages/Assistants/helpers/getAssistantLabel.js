export const getAssistantLabel = (direction) => {
    if (!direction || !direction.src_token || !direction.dst_token) {
        return "Invalid direction";
    }

    const { type, src_token, dst_token } = direction;

    const [home_token, foreign_token] = type === "expatriation" ? [src_token, dst_token] : [dst_token, src_token];

    return `${home_token.symbol} on ${home_token.network} -> ${foreign_token.symbol} on ${foreign_token.network} (${dst_token.network} side)`;
}
