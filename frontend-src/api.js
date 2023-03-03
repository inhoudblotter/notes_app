import { alert } from "./lib";

const PREFIX = "/api/notes";

const req = (url, options = {}) => {
  const { body } = options;
  console.log((PREFIX + url).replace(/\/\/$/, ""));
  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
        alert(message);
        throw new Error(message);
        })
  );
};

export const getNotes = ({ age, search, page }) => {
  return req("/?" + new URLSearchParams({ age, search, page }), { method: "GET" });
};

export const createNote = (title, text) => {
  return req("/note", {
    method: "POST",
    body: { title, text },
  });
};

export const getNote = (id) => {
  return req(`/${id}`, {
    method: "GET",
  });
};

export const archiveNote = (id) => {
  return req(`/${id}`, {
    method: 'PATCH',
    body: {isArchived: true},
  })
};

export const unarchiveNote = (id) => {
  return req(`/${id}`, {
    method: 'PATCH',
    body: {isArchived: false},
  })
};

export const editNote = (id, title, text) => {
  return req(`/${id}`, {
    method: 'PATCH',
    body: {title, text},
  })
};

export const deleteNote = (id) => {
  return req(`/${id}`, {
    method: "DELETE",
  });
};

export const deleteAllArchived = () => {
  return req("/", {
    method: "DELETE",
  });
};

// export const notePdfUrl = (id) => {
//   return `${PREFIX + '/' + id + '?pdf=true'}`
// };
