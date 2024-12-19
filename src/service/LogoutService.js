export const LogoutService = (router) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("area");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("id");
    router.push("/auth/login");
}