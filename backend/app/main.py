import logging
import time
import io
import uuid
from typing import Optional

import numpy as np
import tensorflow as tf
import urllib.request
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Configure logging with Windows-compatible encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.FileHandler('netra_api.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Netra AI - Medical Diagnostic API",
    description="AI-powered diagnostic API with INT8 quantized models for optimal performance",
    version="1.1.0"
)

# ✅ FIX: Replace wildcard with specific origins when using credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:2000",        # Your frontend development server
        "http://localhost:3000",        # Alternative frontend port
        "http://127.0.0.1:2000",        # Alternative localhost format
        "https://yourdomain.com",       # Production frontend domain
    ],
    allow_credentials=True,              # This requires specific origins, not "*"
    allow_methods=["*"],
    allow_headers=["*"],
)
# Global variables for models
dr_interpreter = None
dr_input_details = None
dr_output_details = None
glaucoma_interpreter = None
glaucoma_input_details = None
glaucoma_output_details = None

# Model input/output scale and zero_point for INT8 quantization
dr_input_scale = None
dr_input_zero_point = None
dr_output_scale = None
dr_output_zero_point = None
glaucoma_input_scale = None
glaucoma_input_zero_point = None
glaucoma_output_scale = None
glaucoma_output_zero_point = None

# Constants
TARGET_SIZE = (224, 224)

DR_CLASSES = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]
GLAUCOMA_CLASSES = ["Normal", "Glaucoma"]

DR_NOTES = {
    0: "No diabetic retinopathy detected. Continue routine screening.",
    1: "Mild changes detected. Regular follow-up recommended.",
    2: "Signs of moderate non-proliferative DR. Monitor and consider treatment.",
    3: "Severe NPDR detected. Closer monitoring and treatment required.",
    4: "Proliferative DR detected. Immediate treatment is strongly advised."
}

GLAUCOMA_NOTES = {
    0: "No significant signs of glaucoma.",
    1: "Increased likelihood of glaucoma. Recommend further IOP measurement and visual field testing."
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

# Pre-allocated arrays for memory optimization
IMG_BUFFER = np.zeros((1, 224, 224, 3), dtype=np.float32)


def load_models():
    """Load INT8 quantized TFLite models with threading optimization"""
    global dr_interpreter, dr_input_details, dr_output_details
    global glaucoma_interpreter, glaucoma_input_details, glaucoma_output_details
    global dr_input_scale, dr_input_zero_point, dr_output_scale, dr_output_zero_point
    global glaucoma_input_scale, glaucoma_input_zero_point, glaucoma_output_scale, glaucoma_output_zero_point
    
    try:
        logger.info("Loading INT8 quantized DR TFLite model...")
        # Try to load quantized model first, fallback to regular model
        try:
            dr_interpreter = tf.lite.Interpreter(
                model_path="models/DR/dr_model_int8.tflite",
                num_threads=4
            )
            logger.info("Loaded INT8 quantized DR model")
        except:
            logger.warning("INT8 DR model not found, using regular model")
            dr_interpreter = tf.lite.Interpreter(
                model_path="models/DR/dr_model.tflite",
                num_threads=4
            )
        
        dr_interpreter.allocate_tensors()
        dr_input_details = dr_interpreter.get_input_details()
        dr_output_details = dr_interpreter.get_output_details()
        
        # Get quantization parameters for INT8 models
        dr_input_scale = dr_input_details[0].get('quantization_parameters', {}).get('scales', [1.0])[0]
        dr_input_zero_point = dr_input_details[0].get('quantization_parameters', {}).get('zero_points', [0])[0]
        dr_output_scale = dr_output_details[0].get('quantization_parameters', {}).get('scales', [1.0])[0]
        dr_output_zero_point = dr_output_details[0].get('quantization_parameters', {}).get('zero_points', [0])[0]
        
        logger.info(f"DR model loaded - Input: {dr_input_details[0]['shape']}, Output: {dr_output_details[0]['shape']}")
        logger.info(f"DR quantization - Input scale: {dr_input_scale}, zero_point: {dr_input_zero_point}")

        logger.info("Loading INT8 quantized Glaucoma TFLite model...")
        # Try to load quantized model first, fallback to regular model
        try:
            glaucoma_interpreter = tf.lite.Interpreter(
                model_path="models/Glaucoma/glaucoma_model_int8.tflite",
                num_threads=4
            )
            logger.info("Loaded INT8 quantized Glaucoma model")
        except:
            logger.warning("INT8 Glaucoma model not found, using regular model")
            glaucoma_interpreter = tf.lite.Interpreter(
                model_path="models/Glaucoma/glaucoma_model.tflite",
                num_threads=4
            )
        
        glaucoma_interpreter.allocate_tensors()
        glaucoma_input_details = glaucoma_interpreter.get_input_details()
        glaucoma_output_details = glaucoma_interpreter.get_output_details()
        
        # Get quantization parameters
        glaucoma_input_scale = glaucoma_input_details[0].get('quantization_parameters', {}).get('scales', [1.0])[0]
        glaucoma_input_zero_point = glaucoma_input_details[0].get('quantization_parameters', {}).get('zero_points', [0])[0]
        glaucoma_output_scale = glaucoma_output_details[0].get('quantization_parameters', {}).get('scales', [1.0])[0]
        glaucoma_output_zero_point = glaucoma_output_details[0].get('quantization_parameters', {}).get('zero_points', [0])[0]
        
        logger.info(f"Glaucoma model loaded - Input: {glaucoma_input_details[0]['shape']}, Output: {glaucoma_output_details[0]['shape']}")
        logger.info(f"Glaucoma quantization - Input scale: {glaucoma_input_scale}, zero_point: {glaucoma_input_zero_point}")
        
    except Exception as e:
        logger.error(f"Failed to load models: {str(e)}")
        raise


def validate_image(image: Image.Image) -> bool:
    """Validate image format and size"""
    if image.mode not in ['RGB', 'RGBA', 'L']:
        logger.warning(f"Unsupported image mode: {image.mode}")
        return False
    
    if image.size[0] < 50 or image.size[1] < 50:
        logger.warning(f"Image too small: {image.size}")
        return False
    
    return True


def preprocess_image_quantized(image: Image.Image, target_size: tuple = TARGET_SIZE) -> tuple:
    """Memory-optimized preprocessing with quantization support"""
    global IMG_BUFFER
    
    start_time = time.time()
    
    if not validate_image(image):
        raise ValueError("Invalid image format or size")
    
    # Convert and resize efficiently
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    image = image.resize(target_size, Image.LANCZOS)
    
    # Use pre-allocated buffer
    img_data = np.array(image, dtype=np.float32) / 255.0
    np.copyto(IMG_BUFFER[0], img_data)
    
    preprocessing_time = (time.time() - start_time) * 1000
    logger.debug(f"Quantized preprocessing completed in {preprocessing_time:.2f}ms")
    
    return IMG_BUFFER.copy()  # Return copy for thread safety


def quantize_input(img_array: np.ndarray, scale: float, zero_point: int) -> np.ndarray:
    """Convert float32 input to INT8 for quantized models"""
    if scale == 1.0 and zero_point == 0:
        # Model is not quantized, return float input
        return img_array
    
    # Quantize: q = round(f/scale) + zero_point
    quantized = np.round(img_array / scale) + zero_point
    quantized = np.clip(quantized, -128, 127).astype(np.int8)
    return quantized


def dequantize_output(quantized_output: np.ndarray, scale: float, zero_point: int) -> np.ndarray:
    """Convert INT8 output back to float32"""
    if scale == 1.0 and zero_point == 0:
        # Model output is not quantized
        return quantized_output
    
    # Dequantize: f = scale * (q - zero_point)
    return scale * (quantized_output.astype(np.float32) - zero_point)


def predict_with_tflite_quantized(interpreter, input_details, output_details, 
                                 img_array: np.ndarray, input_scale: float, 
                                 input_zero_point: int, output_scale: float, 
                                 output_zero_point: int) -> np.ndarray:
    """Optimized TFLite inference with INT8 quantization support"""
    start_time = time.time()
    
    try:
        # Handle quantized vs non-quantized models
        if input_details[0]['dtype'] == np.int8:
            # Quantize input for INT8 model
            quantized_input = quantize_input(img_array, input_scale, input_zero_point)
            interpreter.set_tensor(input_details[0]['index'], quantized_input)
        else:
            # Use float input for non-quantized model
            interpreter.set_tensor(input_details[0]['index'], img_array.astype(np.float32))
        
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])
        
        # Handle quantized output
        if output_details[0]['dtype'] == np.int8:
            predictions = dequantize_output(predictions, output_scale, output_zero_point)
        
        inference_time = (time.time() - start_time) * 1000
        logger.debug(f"Quantized inference completed in {inference_time:.2f}ms")
        
        return predictions
    
    except Exception as e:
        logger.error(f"Quantized TFLite inference failed: {str(e)}")
        raise


async def load_image_from_source(file: Optional[UploadFile], img_url: Optional[str]) -> Image.Image:
    """Load image from file or URL with validation"""
    try:
        if file:
            logger.info(f"Loading image from uploaded file: {file.filename}")
            
            if hasattr(file, 'size') and file.size > MAX_IMAGE_SIZE:
                raise ValueError(f"File too large: {file.size} bytes")
            
            image = Image.open(file.file)
            
        else:
            logger.info(f"Fetching image from URL...")
            
            request = urllib.request.Request(
                img_url,
                headers={'User-Agent': 'Netra-AI/1.0'}
            )
            
            with urllib.request.urlopen(request, timeout=10) as response:
                image_bytes = response.read()
                
                if len(image_bytes) > MAX_IMAGE_SIZE:
                    raise ValueError(f"Image too large: {len(image_bytes)} bytes")
                
                image = Image.open(io.BytesIO(image_bytes))
        
        logger.info(f"Image loaded - Size: {image.size}, Mode: {image.mode}")
        return image
        
    except Exception as e:
        logger.error(f"Failed to load image: {str(e)}")
        raise


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log requests with performance tracking"""
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"[{request_id}] {request.method} {request.url.path} - {process_time:.2f}ms - {response.status_code}")
    
    return response


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check if models are quantized
    dr_quantized = dr_input_details[0]['dtype'] == np.int8 if dr_input_details else False
    glaucoma_quantized = glaucoma_input_details[0]['dtype'] == np.int8 if glaucoma_input_details else False
    
    return {
        "status": "healthy", 
        "models_loaded": dr_interpreter is not None and glaucoma_interpreter is not None,
        "optimizations": {
            "image_size": f"{TARGET_SIZE[0]}x{TARGET_SIZE[1]}",
            "multi_threading": "enabled",
            "memory_optimization": "enabled",
            "int8_quantization": {
                "dr_model": dr_quantized,
                "glaucoma_model": glaucoma_quantized
            }
        }
    }


@app.post("/api/ai-diagnoses")
async def diagnose(file: UploadFile = File(None), img_url: str = Form(None)):
    """Optimized diagnostic endpoint with INT8 quantization"""
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]

    # Input validation
    if not file and not img_url:
        return JSONResponse(
            content={"error": "Either file or img_url must be provided"},
            status_code=400
        )

    if file and img_url:
        return JSONResponse(
            content={"error": "Provide either file or img_url, not both"},
            status_code=400
        )

    try:
        # Load and preprocess image
        load_start = time.time()
        image = await load_image_from_source(file, img_url)
        img_array = preprocess_image_quantized(image)
        load_time = (time.time() - load_start) * 1000

        # DR prediction with quantization
        dr_start = time.time()
        dr_preds = predict_with_tflite_quantized(
            dr_interpreter, dr_input_details, dr_output_details, img_array,
            dr_input_scale, dr_input_zero_point, dr_output_scale, dr_output_zero_point
        )
        dr_probs = dr_preds[0].tolist()
        dr_index = int(np.argmax(dr_probs))
        dr_confidence = float(np.max(dr_probs))
        dr_time = (time.time() - dr_start) * 1000

        # Glaucoma prediction with quantization
        glaucoma_start = time.time()
        glaucoma_preds = predict_with_tflite_quantized(
            glaucoma_interpreter, glaucoma_input_details, glaucoma_output_details, img_array,
            glaucoma_input_scale, glaucoma_input_zero_point, glaucoma_output_scale, glaucoma_output_zero_point
        )
        
        # Handle binary classification
        if glaucoma_preds.shape[1] == 1:
            glaucoma_prob_positive = float(glaucoma_preds[0][0])
            glaucoma_probs = [1.0 - glaucoma_prob_positive, glaucoma_prob_positive]
        else:
            glaucoma_probs = glaucoma_preds[0].tolist()
        
        glaucoma_index = int(np.argmax(glaucoma_probs))
        glaucoma_confidence = float(np.max(glaucoma_probs))
        glaucoma_time = (time.time() - glaucoma_start) * 1000

        # Build response
        total_time = int((time.time() - start_time) * 1000)
        
        response_data = {
            "diabetic_retinopathy": {
                "prediction": DR_CLASSES[dr_index],
                "confidence": round(dr_confidence, 3),
                "probabilities": {DR_CLASSES[i]: round(float(dr_probs[i]), 3) for i in range(len(DR_CLASSES))},
                "severity_level": dr_index,
                "doctor_note": DR_NOTES.get(dr_index, "")
            },
            "glaucoma": {
                "prediction": GLAUCOMA_CLASSES[glaucoma_index],
                "confidence": round(glaucoma_confidence, 3),
                "probabilities": {GLAUCOMA_CLASSES[i]: round(float(glaucoma_probs[i]), 3) for i in range(len(GLAUCOMA_CLASSES))},
                "severity_level": glaucoma_index,
                "doctor_note": GLAUCOMA_NOTES.get(glaucoma_index, "")
            },
            "meta": {
                "request_id": request_id,
                "image_size": f"{TARGET_SIZE[0]}x{TARGET_SIZE[1]}",
                "model_version": "tflite_v1_int8_optimized",
                "inference_time_ms": total_time,
                "input_source": "file" if file else "url",
                "optimizations_applied": [
                    "multi_threading", 
                    "memory_optimization", 
                    "int8_quantization"
                ],
                "timing": {
                    "image_loading_ms": round(load_time, 2),
                    "dr_prediction_ms": round(dr_time, 2),
                    "glaucoma_prediction_ms": round(glaucoma_time, 2)
                }
            }
        }

        logger.info(f"[{request_id}] Completed in {total_time}ms (INT8 optimized)")
        return response_data

    except Exception as e:
        logger.exception(f"[{request_id}] Error: {str(e)}")
        return JSONResponse(
            content={"error": f"Error processing image: {str(e)}", "request_id": request_id},
            status_code=500
        )


@app.on_event("startup")
async def startup_event():
    """Initialize models and warmup"""
    try:
        logger.info("Starting Netra AI with INT8 quantization optimizations...")
        
        load_models()
        
        # Warmup with correct input size
        logger.info("Warming up quantized models...")
        dummy = np.zeros((1, TARGET_SIZE[0], TARGET_SIZE[1], 3), dtype=np.float32)
        
        predict_with_tflite_quantized(
            dr_interpreter, dr_input_details, dr_output_details, dummy,
            dr_input_scale, dr_input_zero_point, dr_output_scale, dr_output_zero_point
        )
        predict_with_tflite_quantized(
            glaucoma_interpreter, glaucoma_input_details, glaucoma_output_details, dummy,
            glaucoma_input_scale, glaucoma_input_zero_point, glaucoma_output_scale, glaucoma_output_zero_point
        )
        
        logger.info("Netra AI ready with INT8 quantization!")
        
    except Exception as e:
        logger.error(f"Failed to start: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Netra AI...")


@app.get("/performance")
async def performance_stats():
    """Performance statistics"""
    dr_quantized = dr_input_details[0]['dtype'] == np.int8 if dr_input_details else False
    glaucoma_quantized = glaucoma_input_details[0]['dtype'] == np.int8 if glaucoma_input_details else False
    
    return {
        "optimizations": {
            "phase": "1 + INT8 Quantization",
            "image_size": f"{TARGET_SIZE[0]}x{TARGET_SIZE[1]}",
            "multi_threading": True,
            "memory_optimization": True,
            "int8_quantization": {
                "dr_model": dr_quantized,
                "glaucoma_model": glaucoma_quantized
            },
            "expected_improvement": "60-80% total latency reduction"
        },
        "next_optimizations": [
            "Custom input size models (160x160)",
            "GPU acceleration",
            "Model pruning"
        ]
    }
