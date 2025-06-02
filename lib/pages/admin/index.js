import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Admin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [newRestaurant, setNewRestaurant] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '', image: null, is_available: true });
  const [editingItem, setEditingItem] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');

  // Check if admin is logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsLoggedIn(true);
      else router.push('/admin');
    };
    checkSession();
  }, [router]);

  // Fetch restaurants
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchRestaurants() {
      try {
        const response = await fetch(`${apiUrl}/api/restaurants`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setRestaurants(data);
        if (data.length > 0) setSelectedRestaurant(data[0].id);
      } catch (err) {
        setError(`Failed to fetch restaurants: ${err.message}`);
      }
    }
    fetchRestaurants();
  }, [isLoggedIn, apiUrl]);

  // Fetch categories and menu items for selected restaurant
  useEffect(() => {
    if (!isLoggedIn || !selectedRestaurant) return;
    async function fetchData() {
      try {
        const [categoriesResponse, menuResponse] = await Promise.all([
          fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/categories`),
          fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/menu`)
        ]);
        if (!categoriesResponse.ok || !menuResponse.ok) throw new Error('HTTP error');
        const categoriesData = await categoriesResponse.json();
        const menuData = await menuResponse.json();
        setCategories(categoriesData);
        setMenuItems(menuData);
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`);
      }
    }
    fetchData();
  }, [isLoggedIn, selectedRestaurant, apiUrl]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setIsLoggedIn(true);
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    }
  };

  const addRestaurant = async () => {
    if (!newRestaurant) return setError('Restaurant name is required');
    try {
      const response = await fetch(`${apiUrl}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRestaurant })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setRestaurants([...restaurants, data]);
      setNewRestaurant('');
    } catch (err) {
      setError(`Failed to add restaurant: ${err.message}`);
    }
  };

  const addCategory = async () => {
    if (!newCategory) return setError('Category name is required');
    try {
      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCategories([...categories, data]);
      setNewCategory('');
    } catch (err) {
      setError(`Failed to add category: ${err.message}`);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/categories/${categoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (err) {
      setError(`Failed to delete category: ${err.message}`);
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return setError('Name and price are required');
    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description);
      formData.append('price', newItem.price);
      formData.append('category_id', newItem.category_id);
      formData.append('is_available', newItem.is_available.toString());
      if (newItem.image) formData.append('image', newItem.image);

      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/menu`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMenuItems([...menuItems, { ...data, category: categories.find(c => c.id === newItem.category_id)?.name }]);
      setNewItem({ name: '', description: '', price: '', category_id: '', image: null, is_available: true });
    } catch (err) {
      setError(`Failed to add item: ${err.message}`);
    }
  };

  const updateMenuItem = async () => {
    if (!editingItem.name || !editingItem.price) return setError('Name and price are required');
    try {
      const formData = new FormData();
      formData.append('name', editingItem.name);
      formData.append('description', editingItem.description);
      formData.append('price', editingItem.price);
      formData.append('category_id', editingItem.category_id);
      formData.append('is_available', editingItem.is_available.toString());
      if (editingItem.image) formData.append('image', editingItem.image);

      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/menu/${editingItem.id}`, {
        method: 'PATCH',
        body: formData
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? { ...data, category: categories.find(c => c.id === editingItem.category_id)?.name } : item));
      setEditingItem(null);
    } catch (err) {
      setError(`Failed to update item: ${err.message}`);
    }
  };

  const deleteMenuItem = async (itemId) => {
    try {
      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMenuItems(menuItems.filter(item => item.id !== itemId));
    } catch (err) {
      setError(`Failed to delete item: ${err.message}`);
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/restaurants/${selectedRestaurant}/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentStatus })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMenuItems(menuItems.map(item => item.id === itemId ? data : item));
    } catch (err) {
      setError(`Failed to update availability: ${err.message}`);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          {error && <p className="text-red-500 mb-4 text-center" role="alert">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Password"
          />
          <button
            className="bg-blue-600 text-white px-4 py-3 rounded-lg w-full hover:bg-blue-700 transition"
            onClick={handleLogin}
            aria-label="Login"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white shadow-lg p-4 fixed h-full">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">CafeSaaS Admin</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Restaurant</label>
          <select
            value={selectedRestaurant || ''}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="border p-2 w-full rounded-lg"
          >
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="New Restaurant"
            value={newRestaurant}
            onChange={(e) => setNewRestaurant(e.target.value)}
            className="border p-2 w-full mt-2 rounded-lg"
          />
          <button
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
            onClick={addRestaurant}
          >
            Add Restaurant
          </button>
        </div>
        <button
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
          onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))}
          aria-label="Logout"
        >
          Logout
        </button>
      </div>

      <div className="ml-64 flex-1 p-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}

        {selectedRestaurant && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Menu</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add Category</h3>
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="border p-3 rounded-lg w-full mb-4"
              />
              <button
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                onClick={addCategory}
              >
                Add Category
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={editingItem ? editingItem.description : newItem.description}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, description: e.target.value })
                    : setNewItem({ ...newItem, description: e.target.value })
                  }
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={editingItem ? editingItem.price : newItem.price}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, price: e.target.value })
                    : setNewItem({ ...newItem, price: e.target.value })
                  }
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={editingItem ? editingItem.category_id : newItem.category_id}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, category_id: e.target.value })
                    : setNewItem({ ...newItem, category_id: e.target.value })
                  }
                  className="border p-3 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, image: e.target.files[0] })
                    : setNewItem({ ...newItem, image: e.target.files[0] })
                  }
                  className="border p-3 rounded-lg"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem ? editingItem.is_available : newItem.is_available}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, is_available: e.target.checked })
                      : setNewItem({ ...newItem, is_available: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Available
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  onClick={editingItem ? updateMenuItem : addMenuItem}
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    onClick={() => setEditingItem(null)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <table className="w-full bg-white rounded-lg shadow-md mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-b">
                    <td className="py-3 px-4">{category.name}</td>
                    <td className="text-center py-3 px-4">
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="text-lg font-semibold mb-4">Menu Items</h3>
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-center py-3 px-4">Available</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4">{item.category || '-'}</td>
                    <td className="py-3 px-4">{item.description || '-'}</td>
                    <td className="text-right py-3 px-4">₹{item.price.toFixed(2)}</td>
                    <td className="text-center py-3 px-4">
                      {item.is_available ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4 flex gap-2 justify-center">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => setEditingItem({ ...item, image: null })}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                      >
                        {item.is_available ? 'Make Unavailable' : 'Make Available'}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteMenuItem(item.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}