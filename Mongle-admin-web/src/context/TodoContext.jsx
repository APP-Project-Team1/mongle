import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TodoContext = createContext(null);

export function TodoProvider({ children }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      // todos 실제 컬럼: id, planner_id, couple_id, text, due_date, urgent, done, created_at
      const { data, error } = await supabase
        .from('todos')
        .select('id, text, due_date, urgent, done, couple_id, planner_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ done: !todo.done })
        .eq('id', id);

      if (error) throw error;

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const addTodo = async ({ text, couple_id, urgent }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ text, couple_id, urgent, done: false }])
        .select();

      if (error) throw error;

      setTodos((prev) => [...data, ...prev]);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  return (
    <TodoContext.Provider value={{ todos, loading, toggleTodo, addTodo, fetchTodos }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodo must be used within <TodoProvider>');
  return ctx;
}
