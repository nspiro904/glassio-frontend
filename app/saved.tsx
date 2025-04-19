import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function ImageGallery(){
  const [savedImages, setSavedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const loadSavedImages = async () => {
    try {
      const appDir = FileSystem.documentDirectory;
      const files = await FileSystem.readDirectoryAsync(appDir);
      
      // Filter images (case-insensitive)
      const images = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      return images.map(file => ({
        name: file,
        uri: `${appDir}${file}` // Full URI for Image component
      }));
    } catch (error) {
      console.error('Error loading images:', error);
      return [];
    }
  };

  useEffect(() => {
    loadSavedImages().then(images => setSavedImages(images));
  }, []);

  return (
    <View style={styles.container}>
      {savedImages.length > 0 ? (
        <FlatList
          data={savedImages}
          keyExtractor={(item) => item.name}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedImage(item.uri)}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}
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
    
   
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  thumbnail: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
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
