'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Product } from '@/lib/types';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    image: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'FARMER') {
      router.push('/');
      return;
    }

    loadProducts();
  }, [token, user, router]);

  const loadProducts = async () => {
    try {
      const response = await apiClient.getMyProducts();
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        ...(formData.image && { image: formData.image }),
      };

      await apiClient.createProduct(payload);
      setSuccess('Product added successfully!');
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        image: '',
      });
      setShowForm(false);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiClient.deleteProduct(productId);
      setSuccess('Product deleted successfully!');
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  if (loading) {
    return <div className="container mx-auto py-12 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">Farmer Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-success">
          {success}
        </div>
      )}

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Products</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-6">Add New Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Tomatoes"
                required
              />
            </div>

            <div>
              <label className="form-label">Description (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Describe your product..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Vegetables, Grains"
                  required
                />
              </div>
              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="100"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="bags">Bags</option>
                  <option value="tons">Tons</option>
                  <option value="crates">Crates</option>
                  <option value="units">Units</option>
                </select>
              </div>
              <div>
                <label className="form-label">Price per Unit</label>
                <input
                  type="number"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Image URL (optional)</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://..."
              />
            </div>

            <button type="submit" className="w-full btn-primary">
              Add Product
            </button>
          </form>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No products yet. Add your first product!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="card">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{product.description}</p>
              <div className="space-y-2 mb-4 text-sm">
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Available:</strong> {product.quantity} {product.unit}</p>
                <p><strong>Price:</strong> ₦{product.pricePerUnit.toLocaleString()}/{product.unit}</p>
                <p><strong>Status:</strong> {product.available ? '✓ Active' : '✗ Inactive'}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-secondary text-sm">Edit</button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Section */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>
        <div className="card text-center py-12">
          <p className="text-gray-600">Orders from buyers will appear here</p>
        </div>
      </div>
    </div>
  );
}
