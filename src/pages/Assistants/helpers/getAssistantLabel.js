export const getAssistantLabel = (direction) => {
    if (!direction || !direction.src_token || !direction.dst_token) {
        return "Invalid direction";
    }
    const { src_token, dst_token } = direction;
    return `${dst_token.symbol} on ${dst_token.network} -> ${src_token.symbol} on ${src_token.network} (${dst_token.network} side)`;
}
