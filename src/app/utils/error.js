// Ensure every caught error looks like { code, message, details, status }
export function normalizeAxiosError(err) {
    // Axios error?
    const isAxios = !!err?.isAxiosError || !!err?.response || !!err?.request;

    if (!isAxios) {
        return { code: "UNKNOWN", message: err?.message || "Unexpected error", details: err, status: undefined };
    }

    // Network / CORS / timeout
    if (err?.code === "ECONNABORTED" || !err?.response) {
        return { code: err?.code || "NETWORK", message: "Network error. Please try again.", details: err, status: undefined };
    }

    const { status, data } = err.response;
    const apiMessage =
        data?.message || data?.error || data?.errors?.[0]?.message || "Something went wrong";

    // Map common statuses
    let code = "HTTP_ERROR";
    if (status === 400) code = "BAD_REQUEST";
    if (status === 401) code = "UNAUTHORIZED";
    if (status === 403) code = "FORBIDDEN";
    if (status === 404) code = "NOT_FOUND";
    if (status >= 500) code = "SERVER_ERROR";

    return { code, message: apiMessage, details: data, status };
}
