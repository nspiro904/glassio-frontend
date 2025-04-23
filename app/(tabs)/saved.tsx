import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, Text, Modal, TouchableOpacity, Dimensions, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Layout from '@/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ImageGallery(){
  const [savedImages, setSavedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const loadSavedImages = async () => {
    try {
      const appDir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(appDir);
      
      const images = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      return images.map(file => ({
        name: file,
        uri: `${appDir}${file}`
      }));
    } catch (error) {
      console.error('Error loading images:', error);
      return [];
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const refreshImages = async () => {
        const images = await loadSavedImages();
        if (isActive) setSavedImages(images);
      };

      refreshImages();
      
      return () => {
        isActive = false; // Cleanup to prevent state updates if component unmounts
      };
    }, [])
  );

  const deleteImage = async (image) => {
    try {
      await FileSystem.deleteAsync(image.uri);
      const updated = savedImages.filter(img => img.uri !== image.uri);
      setSavedImages(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete image.');
      console.error(error);
    }
  };

  useEffect(() => {
    loadSavedImages().then(images => setSavedImages(images));
  }, []);

  const renderImageItem = ({ item }) => (
    <View style={styles.imageWrapper}>
      <TouchableOpacity onPress={() => setSelectedImage(item.uri)}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteImage(item)}>
        <Ionicons name="trash-outline" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Layout>
      <View style={styles.container}>
        {savedImages.length > 0 ? (
          <FlatList
            data={savedImages}
            keyExtractor={(item) => item.name}
            numColumns={3}
            renderItem={renderImageItem}
          />
        ) : (
          <Text style={styles.emptyText}>No images found.</Text>
        )}

        {selectedImage && (
          <Modal visible={true} transparent={true}>
            <TouchableOpacity 
              style={styles.fullscreenBackdrop}
              onPress={() => setSelectedImage(null)}
            >
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullscreenImage} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
    zIndex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
