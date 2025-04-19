import {StyleSheet, Animated} from "react-native"
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function Layout({ children }){
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

    return(
        <LinearGradient
              colors={["#0f0c29", "#302b63", "#24243e"]}
              style={{ flex: 1 }}
            >
            <Animated.Image
                source={require("../assets/logo.png")}
                style={[
                    styles.logo,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                ]}
            />
            {children}
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    logo: {
        width: 140,
        height: 140,
        marginBottom: 10,
        resizeMode: "contain",
        alignSelf: "center"
      },
})