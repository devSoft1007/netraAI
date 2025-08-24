import tensorflow as tf

# Load models with correct paths
dr_model = tf.keras.models.load_model("models/DR/CLINIC_READY_73_PERCENT_MODEL.h5")
glaucoma_model = tf.keras.models.load_model("models/Glaucoma/tpu_glaucoma_final.keras")

# Convert DR model to TFLite
dr_converter = tf.lite.TFLiteConverter.from_keras_model(dr_model)
dr_tflite_model = dr_converter.convert()
with open("models/DR/dr_model.tflite", "wb") as f:
    f.write(dr_tflite_model)

print("✅ DR model converted to TFLite and saved at models/DR/dr_model.tflite")

# Convert Glaucoma model to TFLite
glaucoma_converter = tf.lite.TFLiteConverter.from_keras_model(glaucoma_model)
glaucoma_tflite_model = glaucoma_converter.convert()
with open("models/Glaucoma/glaucoma_model.tflite", "wb") as f:
    f.write(glaucoma_tflite_model)

print("✅ Glaucoma model converted to TFLite and saved at models/Glaucoma/glaucoma_model.tflite")
