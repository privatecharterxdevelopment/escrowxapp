# Contract Upload Workflow - Updated! ✅

## Changes Made

### 1. ✅ Delete/Change File Feature
Users can now **remove and change** the uploaded contract file in Step 3.

**UI Changes**:
- Added "Remove" button next to uploaded file
- Shows "Ready to upload" status
- Blue info box: "File will be encrypted and uploaded to IPFS when you create the escrow in the final step"

### 2. ✅ Upload Only on Final Confirmation
Contract file is **NOT uploaded** until the user clicks "Create Escrow" in Step 5.

**Previous Flow** (OLD):
```
Step 3 → Upload contract → Move to Step 4
         ↑ UPLOADED HERE (can't change)
```

**New Flow** (CURRENT):
```
Step 3 → Select file → Move to Step 4 → Move to Step 5 → Create Escrow
         ↑ Just select              ↑ Review         ↑ UPLOAD HERE
```

### 3. ✅ Better User Experience

**Step 3: Contract Upload**
- Select file (validates size and type)
- **Remove button** to delete and choose another
- Info: "File will be encrypted and uploaded during final submission"
- No IPFS upload yet - just file selection

**Step 5: Review & Submit**
- Shows contract file with "Pending Upload" badge
- Info box explains what happens when clicking "Create Escrow":
  1. Contract encrypted with AES-256
  2. Uploaded to IPFS (Pinata)
  3. Escrow record created
  4. Redirect to funding page
  5. Participants notified

**Final Button**:
- Text: "Create Escrow & Upload Contract"
- Loading states:
  - "Uploading to IPFS..." (during upload)
  - "Creating Escrow..." (after upload, creating DB record)

---

## Code Changes

### 1. Added `removeContractFile()` Function
```typescript
const removeContractFile = () => {
  setFormData(prev => ({ ...prev, contractFile: null }));
  setContractCID('');
  setEncryptionKeys({});
  setUploadProgress(0);
  setError('');
};
```

### 2. Updated `nextStep()` - No Upload in Step 3
```typescript
else if (step === 3) {
  // Just validate file is selected, don't upload yet
  if (!formData.contractFile) {
    setError('Please select a contract file');
    return;
  }
  setStep(4);
}
```

### 3. Updated `handleSubmit()` - Upload on Final Submit
```typescript
const handleSubmit = async () => {
  setLoading(true);
  setError('');

  try {
    // Step 1: Upload contract to IPFS first
    const uploaded = await uploadContract();
    if (!uploaded) {
      setLoading(false);
      return;
    }

    // Step 2: Create escrow record in database
    const { data, error: dbError } = await supabase
      .from('escrows')
      .insert({
        // ... escrow data with contractCID
      });

    if (dbError) throw dbError;

    // Navigate to escrow detail page
    navigate(`/escrow/${data.id}`);
  } catch (err) {
    console.error('Failed to create escrow:', err);
    setError('Failed to create escrow. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 4. Updated UI - Step 3 File Display
```tsx
{formData.contractFile && (
  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">{formData.contractFile.name}</p>
          <p className="text-xs text-green-700">
            {(formData.contractFile.size / 1024 / 1024).toFixed(2)} MB - Ready to upload
          </p>
        </div>
      </div>
      <button
        onClick={removeContractFile}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
      >
        <X className="w-4 h-4" />
        Remove
      </button>
    </div>
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs text-blue-800">
        <strong>Note:</strong> File will be encrypted and uploaded to IPFS when you create the escrow in the final step.
      </p>
    </div>
  </div>
)}
```

### 5. Updated UI - Step 5 Contract Display
```tsx
{formData.contractFile && (
  <div>
    <h3 className="text-sm font-medium text-gray-900 mb-3">Contract File</h3>
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{formData.contractFile.name}</p>
            <p className="text-xs text-gray-600">
              {(formData.contractFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
          Pending Upload
        </span>
      </div>
    </div>
  </div>
)}
```

---

## User Flow Example

### Scenario: User wants to change the contract file

**Step 3: Initial Upload**
1. User selects `contract_v1.pdf`
2. File shows with green checkmark: "contract_v1.pdf - Ready to upload"
3. Blue note: "File will be encrypted and uploaded when you create the escrow"

**Step 3: User Changes Mind**
1. User clicks **"Remove"** button
2. File is cleared, dropzone appears again
3. User selects `contract_v2_final.pdf`
4. New file shows: "contract_v2_final.pdf - Ready to upload"

**Steps 4-5: Review**
1. User proceeds through multi-sig setup
2. Step 5 shows: "contract_v2_final.pdf" with "Pending Upload" badge
3. Info box explains: "Contract will be encrypted and uploaded when you click Create Escrow"

**Final Submit**
1. User clicks **"Create Escrow & Upload Contract"**
2. Button shows: "Uploading to IPFS..." ⏳
3. File encrypted with AES-256
4. Uploaded to Pinata IPFS
5. Button shows: "Creating Escrow..." ⏳
6. Database record created with IPFS CID
7. ✅ Redirect to escrow detail page

---

## Benefits

### 1. **User Control** ✅
- Can change file at any time before final submission
- No accidental uploads
- Clear indication of upload status

### 2. **Better UX** ✅
- Upload only happens once, at the end
- Clear feedback at each step
- Loading states show exactly what's happening

### 3. **Efficiency** ✅
- Don't waste IPFS storage/bandwidth on files user might change
- Only upload confirmed, final contracts
- Less chance of orphaned IPFS files

### 4. **Transparency** ✅
- User knows exactly when upload happens
- Can review everything before committing
- Button text clearly states action: "Create Escrow & Upload Contract"

---

## File Validation

**Allowed Types**:
- PDF: `application/pdf`
- DOC: `application/msword`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- TXT: `text/plain`

**Size Limit**: 10 MB

**Error Messages**:
- File too large: "File too large. Max size: 10 MB"
- Invalid type: "Invalid file type. Please upload PDF, DOC, DOCX, or TXT"
- No file selected: "Please select a contract file"

---

## Testing Checklist

### Step 3: Upload
- ✅ Select PDF file → Shows with checkmark
- ✅ Select DOC file → Shows with checkmark
- ✅ Select 15MB file → Error: "File too large"
- ✅ Select .zip file → Error: "Invalid file type"
- ✅ Click "Remove" → File cleared, dropzone appears
- ✅ Select file, remove, select another → Shows new file

### Step 5: Review
- ✅ Contract file shows with "Pending Upload" badge
- ✅ Info box explains what happens on submit
- ✅ Button text: "Create Escrow & Upload Contract"

### Final Submit
- ✅ Click button → Shows "Uploading to IPFS..."
- ✅ Dev mode → Uses mock CID, instant
- ✅ Production mode → Uploads to Pinata
- ✅ After upload → Shows "Creating Escrow..."
- ✅ Success → Redirects to escrow detail page
- ✅ Error → Shows error message, doesn't navigate

---

## Summary

✅ **Users can now delete and change contract files**  
✅ **Upload only happens when user confirms everything**  
✅ **Clear feedback at every step**  
✅ **Better UX with transparent upload process**  
✅ **Efficient IPFS usage - only upload final contracts**

This gives users full control over their contract file and ensures they can review everything before committing to the IPFS upload! 🚀
