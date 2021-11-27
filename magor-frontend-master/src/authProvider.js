export default {
  // called when the user attempts to login
  login: ({ username, password }) => {
    const request = new Request(`${process.env.REACT_APP_APIURL}/login`, {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    return fetch(request)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(({ token, user }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("role", user.role);
      });
  },
  // called when the user attempts to logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return Promise.resolve();
  },
  // called when the API returns an error
  checkError: (error) => {
    if (error === 401 || error === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      return Promise.reject();
    }
    return Promise.resolve();
  },
  // called when the user navigates to a new location, to check for auth
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return token && role === "admin" ? Promise.resolve() : Promise.reject();
  },
  // called when the user navigates to a new location, to check for permissions
  getPermissions: () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return token && role === "admin" ? Promise.resolve() : Promise.reject();
  },
  // called to check if user has ANY auth
  checkAuthType: (type = 0) => {
    const roles = ["user", "uploader", "admin"];
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const allowed = token && roles.slice(type).indexOf(role) !== -1;
    return {
      allowed,
      requiredAuthType: type,
      hasAuthType: token && role ? roles.indexOf(role) : null,
    };
  },
};
