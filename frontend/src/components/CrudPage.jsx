import { useEffect, useState } from "react";

export default function CrudPage({ title, fields, items, loading, error, onCreate, onDelete }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.name] = f.defaultValue ?? "";
    });
    setForm(initial);
  }, [fields]);

  const submit = async (e) => {
    e.preventDefault();
    await onCreate(form);
    const reset = {};
    fields.forEach((f) => {
      reset[f.name] = f.defaultValue ?? "";
    });
    setForm(reset);
  };

  return (
    <div>
      <h2>{title}</h2>
      <form className="form-grid" onSubmit={submit}>
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            <input
              type={field.type || "text"}
              value={form[field.name] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
              required={field.required}
            />
          </label>
        ))}
        <button type="submit">Add</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <table className="table">
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.name}>{f.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {fields.map((f) => (
                <td key={f.name}>{String(item[f.name] ?? "")}</td>
              ))}
              <td>
                <button onClick={() => onDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
