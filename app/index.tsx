import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { BlurView } from "expo-blur";
import * as Animatable from "react-native-animatable";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import Layout from "@/components/Layout";
import ImageGallery from "@/components/ImageGallery";

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [faceShape, setFaceShape] = useState("");
  const [overlayImages, setOverlayImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scale] = useState(new Animated.Value(1));
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: cam } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: gal } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cam !== "granted" || gal !== "granted") {
        Alert.alert("Permissions needed", "Allow camera and gallery access.");
      }
    })();
  }, []);

  const handlePick = async (from: "camera" | "gallery") => {
    try {
      const result =
        from === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setFaceShape("");
        setOverlayImages([]);
      } else {
        console.log("Image picking cancelled");
      }
    } catch (err) {
      console.error("Error opening picker:", err);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return;

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    try {
      console.log("Predicting...");
      setLoading(true);
      const faceshapeResponse = await axios.post(
        "https://glassio-api.onrender.com/predict",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Predict Successfull");
      setFaceShape(faceshapeResponse.data.face_shape);

      console.log("Overlaying...");

      const overlayBody = new FormData();
      overlayBody.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);
      overlayBody.append("glass_type", `${faceshapeResponse.data.face_shape}`);

      const overlayResponse = await axios.post(
        "https://glassio-api.onrender.com/overlay",
        overlayBody,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log(overlayResponse.data.result_images);
      console.log(overlayResponse.data.result_images.length);

      console.log("Overlay Successfull");
      setLoading(false);
      setOverlayImages(overlayResponse.data.result_images);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong while uploading.");
    }
  };

  const saveImageToAppDirectory = async () => {
    try {
      const fileName = `image_${Date.now()}.jpg`;
      const appDir = FileSystem.documentDirectory; // Private app storage
      const destPath = `${appDir}${fileName}`;

      // Remove the Base64 prefix (e.g., "data:image/png;base64,")
      const cleanBase64 = overlayImages[0].split(",")[1];

      // Write the Base64 data to a file
      await FileSystem.writeAsStringAsync(destPath, cleanBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Image saved to:", destPath);
      Alert.alert("Success", "Image saved successfully");
      return destPath;
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image.");
      return null;
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        {!imageUri && (
          <View style={styles.buttonRow}>
            <GlassButton
              icon={<Ionicons name="camera-outline" size={28} color="white" />}
              label="Take Photo"
              onPress={() => handlePick("camera")}
            />
            <GlassButton
              icon={
                <MaterialIcons name="photo-library" size={28} color="white" />
              }
              label="Pick from Gallery"
              onPress={() => handlePick("gallery")}
            />
          </View>
        )}

        {loading && (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        )}

        {!overlayImages[0] && !loading && imageUri && (
          <>
            <Animatable.Image
              animation="fadeInUp"
              duration={700}
              source={{ uri: imageUri }}
              style={styles.image}
            />
            <GlassButton
              icon={
                <Ionicons name="cloud-upload-outline" size={24} color="white" />
              }
              label="Upload & Predict"
              onPress={uploadImage}
            />
          </>
        )}

        {overlayImages[0] && !loading && (
          <>
            {faceShape && (
              <Animatable.Text
                animation="fadeIn"
                delay={200}
                style={styles.result}
              >
                Detected Shape: {faceShape}
              </Animatable.Text>
            )}
            {/* <Animatable.Image
              animation="fadeInUp"
              duration={700}
              source={{ uri: overlayImages[0] }}
              style={styles.image}
            /> */}
            <ImageGallery overlayImages={overlayImages} />
            <View style={{ flexDirection: "row", gap: "10" }}>
              <GlassButton
                icon={
                  <Ionicons name="download-outline" size={24} color="white" />
                }
                label="Save"
                onPress={saveImageToAppDirectory}
              />
              <GlassButton
                icon={<Ionicons name="refresh" size={24} color="white" />}
                label="Try again"
                onPress={() => {
                  setImageUri(null);
                  setOverlayImages([]);
                }}
              />
            </View>
          </>
        )}
      </View>
    </Layout>
  );
}

function GlassButton({
  icon,
  label,
  onPress,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.glassWrapper,
        wide && styles.wide,
        pressed && { opacity: 0.85 },
      ]}
    >
      <BlurView intensity={50} tint="dark" style={styles.glass}>
        {icon}
        <Text style={styles.glassText}>{label}</Text>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
    resizeMode: "contain",
  },
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 40,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  glassWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    marginVertical: 10,
  },
  wide: {
    width: 240,
    alignSelf: "center",
  },
  glass: {
    width: 140,
    height: 120,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  glassText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 16,
    marginTop: 15,
  },
  result: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
  },
  overlayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    gap: 12,
  },
  overlay: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  resultButtonRow: {},
});
