import React, { createContext, useContext, useState } from 'react';
import { TODOS } from '../data/mockData';

const TodoContext = createContext(null);

export function TodoProvider({ children }) {
  const [todos, setTodos] = useState(TODOS);

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTodo = ({ text, couple, urgent }) => {
    setTodos(prev => [...prev, {
      id: String(Date.now()),
      text,
      couple,
      urgent,
      done: false,
    }]);
  };

  return (
    <TodoContext.Provider value={{ todos, toggleTodo, addTodo }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodo must be used within <TodoProvider>');
  return ctx;
}