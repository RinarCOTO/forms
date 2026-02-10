# Guide: Updating Values to Save in the Database

This guide explains how to update a value in your form and ensure it is saved to the database in your Next.js project.

## 1. Locate the Form State
- Find the React component where your form state is managed (usually with `useState`, `useReducer`, or a form library like React Hook Form).
- Example:
  ```tsx
  const [formData, setFormData] = useState({ fieldName: '' });
  ```

## 2. Update the Value in State
- Use an input handler to update the value in your state when the user changes the input.
- Example:
  ```tsx
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, fieldName: e.target.value });
  };
  ```

## 3. Trigger the Save Action
- On form submission (or auto-save), call your save function.
- Example:
  ```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveToDatabase(formData);
  };
  ```

## 4. Implement the Save Function
- Use your API route, Supabase, or Prisma to save the updated value.
- Example with Supabase:
  ```ts
  import { supabase } from '@/lib/supabase';

  async function saveToDatabase(data) {
    const { error } = await supabase
      .from('your_table')
      .update({ fieldName: data.fieldName })
      .eq('id', data.id);
    if (error) throw error;
  }
  ```
- Example with Prisma:
  ```ts
  import prisma from '@/lib/prisma';

  async function saveToDatabase(data) {
    await prisma.your_table.update({
      where: { id: data.id },
      data: { fieldName: data.fieldName },
    });
  }
  ```

## 5. Confirm the Update
- Optionally, show a success message or reload the data to confirm the update.

## 6. Troubleshooting
- Ensure your API route or database client is correctly configured.
- Check for errors in the save function and handle them appropriately.

---

**Tip:** For more advanced usage, see the hooks in `hooks/` and database helpers in `lib/`.
