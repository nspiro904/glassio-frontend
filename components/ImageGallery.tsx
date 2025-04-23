import React from "react";
import { FlatList, Dimensions, StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");

const ImageGallery = ({ overlayImages, onIndexChange }) => {

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / width);
    onIndexChange?.(currentIndex);
  };

  return (
    <FlatList
      data={overlayImages}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={width}  
      snapToAlignment="center"
      decelerationRate="fast"  
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <Animatable.Image
          animation="fadeInUp"
          duration={700}
          source={{ uri: item }}
          style={styles.image}
        />
      )}
      onScroll={handleScroll}  // Add this
      scrollEventThrottle={16}  // Add for smoother updates
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: width - 40, // Adjust padding as needed
    height: 300, // Set your desired height
    resizeMode: "contain",
    marginHorizontal: 20, // Add some spacing between images
    borderRadius: 10, // Optional styling
  },
});

export default ImageGallery;
