# Image Upload Feature

## Overview
The product creation form has been updated to use **file upload** instead of image URL input. This provides a better user experience and allows farmers to directly upload product images.

## Features

### File Upload
- **Drag & Drop Support Ready**: UI designed for drag-and-drop (can be enhanced further)
- **Click to Upload**: Users can click the image area to select a file
- **Image Preview**: Shows a thumbnail preview of the selected image
- **File Validation**: 
  - Only image files are accepted (png, jpg, gif, etc.)
  - Maximum file size: 5MB
  - Clear error messages if validation fails

### Image Processing
- Images are automatically converted to **base64** format
- This allows direct storage in the database without external file storage
- Images are embedded in the JSON payload sent to the backend

## How to Use

1. **Click "Add Product"** button in the Farmer Dashboard
2. **Fill in product details** (name, category, quantity, etc.)
3. **Click the image upload area** to select a file
4. **See the preview** of your selected image
5. **Click again to change** the image if needed
6. **Submit the form** - image is automatically included

## Technical Details

### Frontend Changes
- **File handling**: `handleImageChange()` processes selected files
- **Base64 conversion**: Automatic conversion on form submission
- **Preview generation**: Real-time preview using FileReader API
- **Validation**: File type and size checking before upload

### Data Flow
```
User selects file → File is validated → Preview is shown
    ↓
User submits form → Image converted to base64 → Sent to backend
    ↓
Backend receives base64 string → Stored in database as text
```

### API
The `createProduct()` method still accepts an optional `image` parameter:
```typescript
async createProduct(data: {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  image?: string;  // Now base64 encoded image data
})
```

## File Validation Rules

| Rule | Value |
|------|-------|
| File Type | Image only (image/*) |
| Max Size | 5MB |
| Supported Formats | PNG, JPG, GIF, WebP, etc. |
| Error Messages | Clear user-friendly messages |

## Error Handling

| Scenario | Message |
|----------|---------|
| Non-image file selected | "Please select a valid image file" |
| File too large | "Image size must be less than 5MB" |
| Other errors | Specific error message from backend |

## UI Components

### Upload Area
- Dashed border that highlights on hover
- Image icon when empty
- Shows preview when image selected
- Displays file name below preview

### States
1. **Empty**: Shows upload icon and instructions
2. **Filled**: Shows image preview with filename
3. **Error**: Shows error message in red alert

## Example: Testing Image Upload

### Via Farmer Dashboard UI
1. Go to `http://localhost:3003/farmer/dashboard` (after login)
2. Click "+ Add Product"
3. Fill in product details
4. Click on the image upload area
5. Select an image file from your computer
6. Verify preview appears
7. Click "Add Product"

### Testing Constraints
- Image must be a valid image file (PNG, JPG, GIF, WebP)
- Image must be less than 5MB
- All other product fields must be valid

## Database Storage

Images are stored as **base64-encoded strings** in the SQLite database:
- Pros: No external storage needed, easy to deploy, image included with product data
- Cons: Database size increases, slower retrieval for large images
- Best for: Small to medium-sized product images

## Future Enhancements

1. **Drag & Drop**: Implement actual drag-and-drop functionality
2. **Image Cropping**: Let users crop/resize before upload
3. **Multiple Images**: Support multiple images per product
4. **Cloud Storage**: Integrate with S3 or similar for larger deployments
5. **Image Compression**: Automatically compress images before storing
6. **CDN**: Use a CDN for faster image delivery
7. **Image Gallery**: Show all product images in marketplace

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

Works with all modern browsers that support:
- File API
- FileReader API
- Base64 encoding
- Image preview

## Troubleshooting

### Image not showing after upload
- Check browser console for errors
- Verify image file is valid
- Ensure file size is under 5MB

### Upload stuck/slow
- Large images take time to convert to base64
- Images are processed client-side before sending
- Progress can be monitored in browser DevTools

### Image appears wrong in marketplace
- Check if image was stored correctly
- Verify base64 encoding is valid
- Test with a smaller image file

## Code Example

```typescript
// The image is now handled automatically:
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validates file type and size
    // Shows preview automatically
    // Stores in formData for submission
  }
};

// On form submit:
if (formData.image) {
  // Convert to base64
  const imageData = await convertToBase64(formData.image);
  // Send with product data
  await apiClient.createProduct({ ...payload, image: imageData });
}
```

## Related Files Modified

- `agroconnect-frontend/app/farmer/dashboard/page.tsx` - Main implementation
- `agroconnect-frontend/lib/api.ts` - No changes needed (still accepts image string)
- Backend - No changes needed (already handles image field)

## Compatibility Note

This change is **backward compatible** - the API still accepts image as a string (whether URL or base64), so no backend changes are required.
