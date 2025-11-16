# Custom Fields System

## Overview
The custom fields system allows users to add dynamic, configurable fields to products. This enables businesses to capture additional product information specific to their needs without modifying the database schema.

## Features

### User-Controlled Field Management
- **Add Fields**: Users can add up to 10 custom fields per product
- **Edit Fields**: Modify existing field configurations
- **Delete Fields**: Remove unwanted fields
- **Reorder Fields**: Drag and drop to reorder fields (future enhancement)

### Supported Field Types
1. **Text Input** - Single line text
2. **Number Input** - Numeric values with validation
3. **Email Input** - Email validation
4. **URL Input** - URL validation
5. **Date Input** - Date picker
6. **Text Area** - Multi-line text
7. **Select Dropdown** - Single choice from options
8. **Checkbox** - Boolean true/false
9. **Radio Buttons** - Single choice from multiple options

### Field Configuration Options
- **Label**: Display name for the field
- **Type**: Field input type (from supported types above)
- **Required**: Whether the field is mandatory
- **Placeholder**: Helper text shown in empty fields
- **Options**: For select/radio fields - configurable label/value pairs
- **Validation Rules**: 
  - Min/Max length for text fields
  - Min/Max value for number fields
  - Custom regex patterns for text validation
  - Custom error messages

## Database Structure

Custom fields are stored as an array in the product document:

```javascript
{
  "_id": "product_id",
  "name": "Product Name",
  // ... other product fields
  "custom_fields": [
    {
      "id": "field_unique_id",
      "label": "Warranty Period",
      "type": "select",
      "value": "1_year",
      "required": true,
      "options": [
        { "label": "1 Year", "value": "1_year" },
        { "label": "2 Years", "value": "2_years" },
        { "label": "3 Years", "value": "3_years" }
      ]
    },
    {
      "id": "field_unique_id_2",
      "label": "Special Instructions",
      "type": "textarea",
      "value": "Handle with care",
      "required": false,
      "placeholder": "Enter any special handling instructions..."
    }
  ]
}
```

## Component Architecture

### CustomFieldsManager
Main component that orchestrates the custom fields system:
- Manages the list of custom fields
- Handles add/edit/delete operations
- Enforces maximum field limit (10)
- Integrates with React Hook Form

### CustomFieldBuilder 
Modal dialog for creating/editing field definitions:
- Field type selection
- Configuration options based on field type
- Validation rule setup
- Options management for select/radio fields

### CustomFieldRenderer
Renders individual field inputs based on field type:
- Handles different input types
- Applies validation rules
- Manages field values
- Shows error states

## Usage Example

```tsx
import CustomFieldsManager from './custom-fields-manager'

// In your form component
<CustomFieldsManager 
  control={form.control}
  name="custom_fields"
  maxFields={10}
/>
```

## TypeScript Types

```typescript
enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  URL = 'url',
  DATE = 'date',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  value: string | number | boolean | string[]
  required: boolean
  placeholder?: string
  options?: CustomFieldOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}
```

## Validation

Custom fields support comprehensive validation:

1. **Required Fields**: Enforced at form submission
2. **Type Validation**: Email, URL, number format validation
3. **Length Validation**: Min/max character limits for text
4. **Range Validation**: Min/max values for numbers
5. **Pattern Validation**: Custom regex patterns
6. **Option Validation**: Select/radio fields must choose from available options

## API Integration

Custom fields are seamlessly integrated with the product CRUD operations:

- **Create Product**: Custom fields included in product creation payload
- **Update Product**: Custom fields updated with product data
- **Fetch Product**: Custom fields retrieved with product details

## Future Enhancements

1. **Field Templates**: Save and reuse common field configurations
2. **Conditional Fields**: Show/hide fields based on other field values
3. **Field Groups**: Organize related fields into collapsible sections
4. **Import/Export**: Bulk field configuration management
5. **Field Dependencies**: Link field options to other field values
6. **Rich Text Fields**: WYSIWYG editor for complex text content
7. **File Upload Fields**: Allow file attachments as custom fields
8. **Calculated Fields**: Fields that compute values from other fields

## Best Practices

1. **Field Naming**: Use clear, descriptive labels
2. **Required Fields**: Only mark truly necessary fields as required
3. **Options Management**: Keep select/radio options concise and relevant
4. **Validation**: Use appropriate validation rules to ensure data quality
5. **Field Limits**: Consider user experience when adding many fields
6. **Performance**: Custom fields are indexed for efficient querying

## Troubleshooting

### Common Issues
1. **Type Errors**: Ensure proper TypeScript types are imported
2. **Validation Failures**: Check field configuration and validation rules
3. **Option Duplicates**: Ensure unique values for select/radio options
4. **Performance**: Limit complex validation patterns for better UX