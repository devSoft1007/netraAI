# quantize_models.py
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import glob

def create_representative_dataset(image_dir="sample_images", num_samples=100):
    """Create representative dataset for quantization calibration"""
    def representative_data_gen():
        # Get sample images from your training data or similar medical images
        image_files = glob.glob(os.path.join(image_dir, "*.jpg")) + \
                     glob.glob(os.path.join(image_dir, "*.png"))
        
        # If no images available, create synthetic data
        if not image_files:
            print("No sample images found, using synthetic data for calibration")
            for _ in range(num_samples):
                # Generate random data that matches your input distribution
                synthetic_data = np.random.rand(224, 224, 3).astype(np.float32)
                yield [np.expand_dims(synthetic_data, axis=0)]
        else:
            print(f"Using {min(len(image_files), num_samples)} sample images for calibration")
            for i, img_path in enumerate(image_files[:num_samples]):
                try:
                    img = Image.open(img_path)
                    img = img.convert('RGB')
                    img = img.resize((224, 224))
                    img_array = np.array(img, dtype=np.float32) / 255.0
                    yield [np.expand_dims(img_array, axis=0)]
                except Exception as e:
                    print(f"Error processing {img_path}: {e}")
                    continue
    
    return representative_data_gen

def quantize_model(model_path, output_path, representative_dataset):
    """Convert Keras model to INT8 quantized TFLite"""
    try:
        print(f"Loading model from {model_path}...")
        
        # Handle different model formats
        if model_path.endswith('.h5'):
            model = tf.keras.models.load_model(model_path)
        elif model_path.endswith('.keras'):
            # For .keras files, load directly
            model = tf.keras.models.load_model(model_path)
        else:
            # If it's a SavedModel directory
            converter = tf.lite.TFLiteConverter.from_saved_model(model_path)
        
        # Create converter from loaded model (for .h5 and .keras files)
        if model_path.endswith(('.h5', '.keras')):
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
        
        # Configure quantization settings
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = representative_dataset
        
        # Enable INT8 quantization
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.int8
        converter.inference_output_type = tf.int8
        
        print("Converting to INT8 quantized TFLite...")
        quantized_tflite_model = converter.convert()
        
        # Save the quantized model
        with open(output_path, 'wb') as f:
            f.write(quantized_tflite_model)
        
        print(f"✅ Quantized model saved to {output_path}")
        
        # Print model size comparison
        if os.path.exists(model_path) and os.path.isfile(model_path):
            original_size = os.path.getsize(model_path)
            quantized_size = os.path.getsize(output_path)
            size_reduction = (1 - quantized_size / original_size) * 100
            print(f"📊 Model size reduction: {size_reduction:.1f}% ({original_size:,} -> {quantized_size:,} bytes)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error quantizing model {model_path}: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting model quantization...")
    
    # Create representative dataset
    representative_dataset = create_representative_dataset()
    
    models_to_quantize = [
        {
            "name": "DR Model",
            "input_path": "models/DR/CLINIC_READY_73_PERCENT_MODEL.h5",
            "output_path": "models/DR/dr_model_int8.tflite"
        },
        {
            "name": "Glaucoma Model", 
            "input_path": "models/Glaucoma/tpu_glaucoma_final.keras",
            "output_path": "models/Glaucoma/glaucoma_model_int8.tflite"
        }
    ]
    
    successful_quantizations = 0
    
    for model_info in models_to_quantize:
        print(f"\n📦 Processing {model_info['name']}...")
        
        if not os.path.exists(model_info['input_path']):
            print(f"⚠️  Model file not found: {model_info['input_path']}")
            continue
            
        success = quantize_model(
            model_info['input_path'],
            model_info['output_path'], 
            representative_dataset
        )
        
        if success:
            successful_quantizations += 1
    
    print(f"\n🎉 Quantization complete! {successful_quantizations}/{len(models_to_quantize)} models quantized successfully")
    
    if successful_quantizations > 0:
        print("✅ You can now use the quantized models in your FastAPI application")
        print("📝 The main.py will automatically detect and use INT8 models when available")
    else:
        print("❌ No models were quantized. Please check the error messages above")
