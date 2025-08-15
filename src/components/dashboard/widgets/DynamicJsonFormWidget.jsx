"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Build as BuildIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  ToggleOn as BooleanIcon,
  Email as EmailIcon,
  Lock as PasswordIcon,
  Link as UrlIcon,
  DateRange as DateIcon,
  Schedule as DateTimeIcon,
  Subject as TextAreaIcon,
  ArrowDropDown as SelectIcon,
  List as ArrayIcon,
  AccountTree as ObjectIcon,
} from "@mui/icons-material"
import "../../../styles/widget/dynamic-json-form-widget.css"

const DEFAULT_WIDGET = { config: {} }

const DynamicJsonFormWidget = ({ widget = DEFAULT_WIDGET, onConfigChange }) => {
  const [formFields, setFormFields] = useState([])
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" })
  const [currentTab, setCurrentTab] = useState(0)
  const [fieldConfigDialog, setFieldConfigDialog] = useState({ open: false, field: null, parentId: null })
  const [isBuilderMode, setIsBuilderMode] = useState(true)

  // Defensive: config fallback
  const config = widget?.config || {}
  const {
    title = "Dynamic JSON Form",
    buttonText = "Submit",
    submitUrl = "",
    httpMethod = "POST",
    headers = {},
    showJsonPreview: configShowPreview = true,
    allowFieldReorder = true,
    enableValidation = true,
    successMessage = "Form submitted successfully!",
    errorMessage = "Failed to submit form",
    defaultFields = [],
    resetAfterSubmit = false,
  } = config

  // Input types with icons and descriptions
  const inputTypes = [
    { value: "string", label: "Text", icon: <TextIcon />, description: "Single line text input" },
    { value: "number", label: "Number", icon: <NumberIcon />, description: "Numeric input with validation" },
    { value: "boolean", label: "Boolean", icon: <BooleanIcon />, description: "True/false toggle switch" },
    { value: "email", label: "Email", icon: <EmailIcon />, description: "Email input with validation" },
    { value: "password", label: "Password", icon: <PasswordIcon />, description: "Masked password input" },
    { value: "url", label: "URL", icon: <UrlIcon />, description: "URL input with validation" },
    { value: "date", label: "Date", icon: <DateIcon />, description: "Date picker" },
    { value: "datetime-local", label: "DateTime", icon: <DateTimeIcon />, description: "Date and time picker" },
    { value: "textarea", label: "Text Area", icon: <TextAreaIcon />, description: "Multi-line text input" },
    { value: "select", label: "Select", icon: <SelectIcon />, description: "Dropdown selection" },
    { value: "array", label: "Array", icon: <ArrayIcon />, description: "Dynamic list of items" },
    { value: "object", label: "Object", icon: <ObjectIcon />, description: "Nested object structure" },
  ]

  useEffect(() => {
    if (Array.isArray(defaultFields) && defaultFields.length > 0 && formFields.length === 0) {
      setFormFields(defaultFields)
      initializeFormData(defaultFields)
    }
    // eslint-disable-next-line
  }, [JSON.stringify(defaultFields)])

  const initializeFormData = (fields) => {
    const data = {}
    if (!Array.isArray(fields)) return
    fields.forEach((field) => {
      if (!field) return
      data[field.key] = getDefaultValue(field.type, field.defaultValue)
      if (field.children && Array.isArray(field.children) && field.type === "object") {
        data[field.key] = {}
        field.children.forEach((child) => {
          if (!child) return
          data[field.key][child.key] = getDefaultValue(child.type, child.defaultValue)
        })
      }
    })
    setFormData(data)
  }

  const getDefaultValue = (type, defaultValue) => {
    if (defaultValue !== undefined) return defaultValue
    switch (type) {
      case "number":
        return 0
      case "boolean":
        return false
      case "array":
        return []
      case "object":
        return {}
      default:
        return ""
    }
  }

  const addField = (type, parentId = null) => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: `field_${formFields.length + 1}`,
      label: `${inputTypes.find((t) => t.value === type)?.label || "Field"} ${formFields.length + 1}`,
      type,
      required: false,
      placeholder: "",
      defaultValue: getDefaultValue(type),
      options: type === "select" ? [{ label: "Option 1", value: "option1" }] : [],
      children: type === "object" ? [] : undefined,
      parentId,
      validation: {
        min: type === "number" ? 0 : undefined,
        max: type === "number" ? 100 : undefined,
        minLength: type === "string" ? undefined : undefined,
        maxLength: type === "string" ? undefined : undefined,
        pattern: undefined,
      },
    }

    if (parentId) {
      setFormFields((prev) =>
        prev.map((field) =>
          field.id === parentId ? { ...field, children: [...(field.children || []), newField] } : field,
        ),
      )
    } else {
      setFormFields((prev) => [...prev, newField])
    }
    setFieldConfigDialog({ open: true, field: newField, parentId })
  }

  const removeField = (fieldId, parentId = null) => {
    if (parentId) {
      setFormFields((prev) =>
        prev.map((field) =>
          field.id === parentId
            ? { ...field, children: (field.children || []).filter((child) => child.id !== fieldId) }
            : field,
        ),
      )
    } else {
      setFormFields((prev) => prev.filter((field) => field.id !== fieldId))
    }
    setFormData((prev) => {
      const newData = { ...prev }
      if (parentId) {
        const parentField = formFields.find((f) => f.id === parentId)
        if (parentField && newData[parentField.key] && Array.isArray(parentField.children)) {
          const childField = parentField.children.find((c) => c.id === fieldId)
          if (childField && newData[parentField.key][childField.key] !== undefined) {
            delete newData[parentField.key][childField.key]
          }
        }
      } else {
        const field = formFields.find((f) => f.id === fieldId)
        if (field && newData[field.key] !== undefined) {
          delete newData[field.key]
        }
      }
      return newData
    })
  }

  const updateField = (fieldId, updates, parentId = null) => {
    if (parentId) {
      setFormFields((prev) =>
        prev.map((field) =>
          field.id === parentId
            ? {
                ...field,
                children: (field.children || []).map((child) =>
                  child.id === fieldId ? { ...child, ...updates } : child,
                ),
              }
            : field,
        ),
      )
    } else {
      setFormFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
    }
  }

  const updateFormData = (key, value, parentKey = null) => {
    setFormData((prev) => {
      const newData = { ...prev }
      if (parentKey) {
        if (!newData[parentKey]) newData[parentKey] = {}
        newData[parentKey][key] = value
      } else {
        newData[key] = value
      }
      return newData
    })
  }

  const validateForm = () => {
    if (!enableValidation) return true

    for (const field of formFields) {
      if (field.required && (!formData[field.key] || formData[field.key] === "")) {
        setNotification({
          open: true,
          message: `${field.label || field.key} is required`,
          severity: "error",
        })
        return false
      }
      if (field.children && Array.isArray(field.children)) {
        for (const child of field.children) {
          if (
            child.required &&
            (!formData[field.key] || !formData[field.key][child.key] || formData[field.key][child.key] === "")
          ) {
            setNotification({
              open: true,
              message: `${child.label || child.key} is required`,
              severity: "error",
            })
            return false
          }
        }
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !submitUrl) {
      if (!submitUrl) {
        setNotification({
          open: true,
          message: "No submit URL configured",
          severity: "error",
        })
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(submitUrl, {
        method: httpMethod,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setNotification({
          open: true,
          message: successMessage,
          severity: "success",
        })
        if (resetAfterSubmit) {
          resetForm()
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `${errorMessage}: ${error.message}`,
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    initializeFormData(formFields)
  }

  const renderField = (field, parentKey = null) => {
    if (!field) return null
    const fieldValue = parentKey ? formData[parentKey]?.[field.key] : formData[field.key]
    switch (field.type) {
      case "boolean":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!fieldValue}
                onChange={(e) => updateFormData(field.key, e.target.checked, parentKey)}
              />
            }
            label={field.label || field.key}
          />
        )
      case "select":
        return (
          <FormControl fullWidth>
            <InputLabel>{field.label || field.key}</InputLabel>
            <Select
              value={fieldValue || ""}
              onChange={(e) => updateFormData(field.key, e.target.value, parentKey)}
              required={field.required}
            >
              {(field.options || []).map((option, index) => (
                <MenuItem key={index} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      case "textarea":
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.label || field.key}
            value={fieldValue || ""}
            onChange={(e) => updateFormData(field.key, e.target.value, parentKey)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      case "array":
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {field.label || field.key}
            </Typography>
            <Paper sx={{ p: 2, border: "1px dashed #ccc" }}>
              {(fieldValue || []).map((item, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={item}
                    onChange={(e) => {
                      const newArray = [...(fieldValue || [])]
                      newArray[index] = e.target.value
                      updateFormData(field.key, newArray, parentKey)
                    }}
                    placeholder={`Item ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => {
                      const newArray = (fieldValue || []).filter((_, i) => i !== index)
                      updateFormData(field.key, newArray, parentKey)
                    }}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newArray = [...(fieldValue || []), ""]
                  updateFormData(field.key, newArray, parentKey)
                }}
                size="small"
                variant="outlined"
              >
                Add Item
              </Button>
            </Paper>
          </Box>
        )
      case "object":
        return (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{field.label || field.key} (Object)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ width: "100%" }}>
                {(field.children || []).map((child) => (
                  <Box key={child.id} sx={{ mb: 2 }}>
                    {renderField(child, field.key)}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      default:
        return (
          <TextField
            fullWidth
            type={field.type === "string" ? "text" : field.type}
            label={field.label || field.key}
            value={fieldValue ?? ""}
            onChange={(e) => {
              const value = field.type === "number" ? Number.parseFloat(e.target.value) || 0 : e.target.value
              updateFormData(field.key, value, parentKey)
            }}
            placeholder={field.placeholder}
            required={field.required}
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max,
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength,
              pattern: field.validation?.pattern,
            }}
          />
        )
    }
  }

  const renderFieldBuilder = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <BuildIcon sx={{ mr: 1 }} />
        Form Builder
      </Typography>
      <Paper sx={{ p: 3, mb: 3, background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Add Form Fields
        </Typography>
        <Grid container spacing={2}>
          {inputTypes.map((type) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={type.value}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => addField(type.value)}
              >
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Box sx={{ color: "primary.main", mb: 1 }}>{type.icon}</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {type.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Form Fields ({formFields.length})
        </Typography>
        {formFields.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body1">No fields added yet. Click on a field type above to get started.</Typography>
          </Box>
        ) : (
          <List>
            {formFields.map((field, index) => (
              <ListItem
                key={field.id}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  mb: 1,
                  background: "rgba(255, 255, 255, 0.8)",
                }}
              >
                <Box sx={{ mr: 2, color: "primary.main" }}>{inputTypes.find((t) => t.value === field.type)?.icon}</Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {field.label || field.key}
                      </Typography>
                      <Chip label={field.type} size="small" color="primary" variant="outlined" />
                      {field.required && <Chip label="Required" size="small" color="error" variant="outlined" />}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Key: {field.key} | Type: {field.type}
                      {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => setFieldConfigDialog({ open: true, field, parentId: null })}
                    size="small"
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => removeField(field.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )

  const renderFormPreview = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <PreviewIcon sx={{ mr: 1 }} />
        Form Preview
      </Typography>
      {formFields.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body1">No fields to preview. Add some fields in the Builder tab.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          {formFields.map((field) => (
            <Box key={field.id} sx={{ mb: 3 }}>
              {renderField(field)}
            </Box>
          ))}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
            <Button onClick={resetForm} variant="outlined" startIcon={<RefreshIcon />}>
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={isLoading || !submitUrl}
            >
              {isLoading ? "Submitting..." : buttonText}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  )

  const renderJsonPreview = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <CodeIcon sx={{ mr: 1 }} />
        JSON Preview
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Form Configuration:
        </Typography>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "16px",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "12px",
            maxHeight: "200px",
          }}
        >
          {JSON.stringify({ fields: formFields }, null, 2)}
        </pre>
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 3 }}>
          Current Form Data:
        </Typography>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "16px",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "12px",
            maxHeight: "200px",
          }}
        >
          {JSON.stringify(formData, null, 2)}
        </pre>
      </Paper>
    </Box>
  )

  const renderFieldConfigDialog = () => {
    const { field, parentId } = fieldConfigDialog
    if (!field) return null
    return (
      <Dialog
        open={fieldConfigDialog.open}
        onClose={() => setFieldConfigDialog({ open: false, field: null, parentId: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Field: {field.label || field.key}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Key"
                value={field.key}
                onChange={(e) =>
                  setFieldConfigDialog((prev) => ({
                    ...prev,
                    field: { ...prev.field, key: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                value={field.label}
                onChange={(e) =>
                  setFieldConfigDialog((prev) => ({
                    ...prev,
                    field: { ...prev.field, label: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={field.type}
                  onChange={(e) =>
                    setFieldConfigDialog((prev) => ({
                      ...prev,
                      field: { ...prev.field, type: e.target.value },
                    }))
                  }
                >
                  {inputTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placeholder"
                value={field.placeholder}
                onChange={(e) =>
                  setFieldConfigDialog((prev) => ({
                    ...prev,
                    field: { ...prev.field, placeholder: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={field.required}
                    onChange={(e) =>
                      setFieldConfigDialog((prev) => ({
                        ...prev,
                        field: { ...prev.field, required: e.target.checked },
                      }))
                    }
                  />
                }
                label="Required Field"
              />
            </Grid>
            {field.type === "select" && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Options:
                </Typography>
                {(field.options || []).map((option, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      label="Label"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])]
                        newOptions[index].label = e.target.value
                        setFieldConfigDialog((prev) => ({
                          ...prev,
                          field: { ...prev.field, options: newOptions },
                        }))
                      }}
                      size="small"
                    />
                    <TextField
                      label="Value"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])]
                        newOptions[index].value = e.target.value
                        setFieldConfigDialog((prev) => ({
                          ...prev,
                          field: { ...prev.field, options: newOptions },
                        }))
                      }}
                      size="small"
                    />
                    <IconButton
                      onClick={() => {
                        const newOptions = (field.options || []).filter((_, i) => i !== index)
                        setFieldConfigDialog((prev) => ({
                          ...prev,
                          field: { ...prev.field, options: newOptions },
                        }))
                      }}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  onClick={() => {
                    const newOptions = [...(field.options || []), { label: "", value: "" }]
                    setFieldConfigDialog((prev) => ({
                      ...prev,
                      field: { ...prev.field, options: newOptions },
                    }))
                  }}
                  size="small"
                  startIcon={<AddIcon />}
                  variant="outlined"
                >
                  Add Option
                </Button>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFieldConfigDialog({ open: false, field: null, parentId: null })}>Cancel</Button>
          <Button
            onClick={() => {
              updateField(field.id, field, parentId)
              setFieldConfigDialog({ open: false, field: null, parentId: null })
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Card className="dynamic-json-form-widget">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5">{title}</Typography>
          <Box>
            <Tooltip title="Toggle Mode">
              <IconButton onClick={() => setIsBuilderMode(!isBuilderMode)}>
                {isBuilderMode ? <PreviewIcon /> : <BuildIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {isBuilderMode ? (
          <Box>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Builder" icon={<BuildIcon />} />
              <Tab label="Preview" icon={<PreviewIcon />} />
              <Tab label="JSON" icon={<CodeIcon />} />
            </Tabs>
            {currentTab === 0 && renderFieldBuilder()}
            {currentTab === 1 && renderFormPreview()}
            {currentTab === 2 && renderJsonPreview()}
          </Box>
        ) : (
          renderFormPreview()
        )}
        {renderFieldConfigDialog()}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

export default DynamicJsonFormWidget
