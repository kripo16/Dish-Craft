import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import axios from "axios";

import { StatusBar } from "expo-status-bar";

import Icon from "react-native-vector-icons/MaterialIcons";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI model with API key and configuration
const apiKey = "";
const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `
You are a recipe generator AI, you suggest a good recipe based on the user's ingredients.
Your reply should look like this:
Recipe Name 
Description
Ingredients:
- Ingredient one 
- Ingredient two
Cooking Steps:
- First Step 
- Second Step
Recipe Benefits:
- Benefit one 
- Benefit two
Example:
Recipe Name: Creamy Chicken Pasta
Description:
This is a classic and comforting dish that's perfect for a weeknight meal. It's easy to make and you can customize it with your favorite vegetables.
Ingredients:
- 1 pound boneless, skinless chicken breasts, cut into bite-sized pieces
- 1 pound pasta (penne, rotini, or your favorite shape)
- 1 tablespoon olive oil
- 1 onion, chopped
- 2 cloves garlic, minced
- 1 (10.75 ounce) can condensed cream of mushroom soup
- 1/2 cup milk
- 1/4 cup grated Parmesan cheese
- 1/2 teaspoon salt
- 1/4 teaspoon black pepper
- 1/2 cup frozen peas (optional)
- 1/4 cup chopped fresh parsley (optional)
Cooking Steps:
1. Cook pasta according to package directions. Drain and set aside.
2. Heat olive oil in a large skillet over medium heat. Add chicken and cook until browned on all sides.
3. Add onion and garlic to the skillet and cook until softened, about 5 minutes.
4. Stir in cream of mushroom soup, milk, Parmesan cheese, salt, and pepper. Bring to a simmer and cook for 5 minutes, stirring occasionally.
5. Stir in cooked pasta, peas, and parsley. Cook for 1 minute more.
6. Serve immediately.
Recipe Benefits:
- Easy to make and adaptable to your preferences.
- Comforting and satisfying meal.
- Provides a good source of protein and carbohydrates.
Restrictions To The AI BOT (YOU):
You always stick to this structure of text !!
`,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const pexelsApiKey = "";

export default function App() {
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState("");
  const [previousRecipes, setPreviousRecipes] = useState([]);
  const [animationValue] = useState(new Animated.Value(0));
  const [loadingText, setLoadingText] = useState("Generating your recipe ...");
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });
  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#FF6F61" />;
  }

  // Function to animate the button
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Fetch a recipe based on input ingredients
  const fetchRecipe = async () => {
    // Check if the input is empty
    if (ingredients.trim() === "") {
      Alert.alert("OOPSIE 🙈", "Please enter some ingredients.");
      return; // Exit the function if input is empty
    }

    setLoading(true);
    animateButton();
    setLoadingText("Generating your recipe ..."); // Set the loading text

    try {
      // Start a chat session with the AI model
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      // Send the message to the AI model
      const result = await chatSession.sendMessage(
        `Suggest a recipe with these ingredients: ${ingredients}`
      );
      console.log(result.response.text());

      // Format the recipe
      const formattedRecipe = formatRecipe(result.response.text());

      // Check if the recipe is valid
      if (
        !formattedRecipe.recipeName ||
        !formattedRecipe.recipeDescription ||
        !formattedRecipe.recipeIngredients ||
        !formattedRecipe.recipeCookingSteps ||
        !formattedRecipe.recipeBenefits
      ) {
        throw new Error("No valid recipe found.");
      }

      // Update state with the formatted recipe
      setRecipe(formattedRecipe);

      // Extract the recipe name and update previous recipes
      const recipeName = extractRecipeName(result.response.text());
      if (recipeName) {
        setPreviousRecipes([...previousRecipes, recipeName]);
        fetchImage(recipeName);
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setRecipe(""); // Clear any existing recipe
      setError(true);
    } finally {
      setLoading(false);
      setLoadingText(""); // Clear the loading text
    }
  };

  // Generate another recipe excluding previous ones
  const generateAnotherRecipe = async () => {
    // Reset the recipe and set loading state
    setRecipe("");
    setLoading(true);
    animateButton();
    setLoadingText("Generating new recipe ..."); // Set loading text

    try {
      // Create the exclusion string based on previous recipes
      const excludeRecipes =
        previousRecipes.length > 0
          ? `Give me a recipe other than ${previousRecipes
              .map((name) => `"${name}"`)
              .join(" and ")}.`
          : "";

      // Combine ingredients and exclusion criteria
      const requestIngredients = `${ingredients} ${excludeRecipes}`;

      // Start a chat session with the AI model
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      // Send the message to the AI model
      const result = await chatSession.sendMessage(
        `Suggest a recipe with these ingredients: ${requestIngredients}`
      );
      console.log(result.response.text());

      // Format the recipe
      const formattedRecipe = formatRecipe(result.response.text());

      // Check if the recipe is valid
      if (
        !formattedRecipe.recipeName ||
        !formattedRecipe.recipeDescription ||
        !formattedRecipe.recipeIngredients ||
        !formattedRecipe.recipeCookingSteps ||
        !formattedRecipe.recipeBenefits
      ) {
        throw new Error("No valid recipe found.");
      }

      // Update state with the formatted recipe
      setRecipe(formattedRecipe);

      // Extract the recipe name and update previous recipes
      const recipeName = extractRecipeName(result.response.text());
      if (recipeName) {
        setPreviousRecipes([...previousRecipes, recipeName]);
        fetchImage(recipeName);
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setRecipe(""); // Clear any existing recipe
      setError(true); // Set the error message
    } finally {
      setLoading(false);
      setLoadingText(""); // Clear the loading text
    }
  };

  // Clear the recipe and input to go back
  const goBack = () => {
    setRecipe("");
    setError(false);
  };

  // Format the recipe text
  const formatRecipe = (recipeText) => {
    let recipeName = "";
    let recipeDescription = "";
    let recipeIngredients = "";
    let recipeCookingSteps = "";
    let recipeBenefits = "";

    const lines = recipeText.split("\n").map((line) => line.trim());
    let currentSection = "";

    lines.forEach((line) => {
      if (line.startsWith("Recipe Name:")) {
        recipeName = line.replace("Recipe Name:", "").trim();
        currentSection = "name";
      } else if (line.startsWith("Description:")) {
        recipeDescription = ""; // Start a new description section
        currentSection = "description";
      } else if (line.startsWith("Ingredients:")) {
        currentSection = "ingredients";
      } else if (
        line.startsWith("Cooking Steps:") ||
        line.startsWith("Steps:")
      ) {
        currentSection = "cookingSteps";
      } else if (line.startsWith("Recipe Benefits:")) {
        currentSection = "benefits";
      } else {
        if (currentSection === "description") {
          recipeDescription += line ? `${line}\n` : "";
        } else if (currentSection === "ingredients") {
          recipeIngredients += line ? `${line}\n` : "";
        } else if (currentSection === "cookingSteps") {
          recipeCookingSteps += line ? `${line}\n` : "";
        } else if (currentSection === "benefits") {
          recipeBenefits += line ? `${line}\n` : "";
        }
      }
    });

    // Remove any trailing newlines
    recipeDescription = recipeDescription.trim();
    recipeIngredients = recipeIngredients.trim();
    recipeCookingSteps = recipeCookingSteps.trim();
    recipeBenefits = recipeBenefits.trim();

    return {
      recipeName,
      recipeDescription,
      recipeIngredients,
      recipeCookingSteps,
      recipeBenefits,
    };
  };

  // Extract the recipe name from the response text
  const extractRecipeName = (recipeText) => {
    const lines = recipeText.split("\n").map((line) => line.trim());
    return lines.length > 0 ? lines[0].replace("Recipe Name:", "").trim() : "";
  };

  const fetchImage = async (query) => {
    try {
      const response = await axios.get(`https://api.pexels.com/v1/search`, {
        params: {
          query,
          per_page: 1,
        },
        headers: {
          Authorization: pexelsApiKey,
        },
      });

      if (response.data.photos.length > 0) {
        setImageUrl(response.data.photos[0].src.large);
      } else {
        setImageUrl(""); // No image found
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      setImageUrl(""); // Error fetching image
    }
  };

  // Animated styles
  const animatedStyle = {
    transform: [
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        }),
      },
    ],
  };

  const {
    recipeName = "",
    recipeDescription = "",
    recipeIngredients = "",
    recipeCookingSteps = "",
    recipeBenefits = "",
  } = recipe;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderContainer}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <StatusBar style="dark" />

          <Text style={styles.errorText}>
            Saaad, no recipe found for you :({"\n"}Try generating again, or use
            diffrent ingredients.
          </Text>
          <TouchableOpacity
            style={[styles.button]}
            onPress={goBack} // Function to handle going back or resetting state
          >
            <Icon
              name="home"
              size={24}
              color="#fff"
              style={{ marginBottom: 5 }}
            />
            <Text style={[styles.buttonText]}> Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !recipe && !error && (
        <>
          <StatusBar style="dark" />
          <Text style={styles.header}>Dish Craft</Text>
          <Text style={styles.semiheader}>Powered by AI 🤖✨</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Enter ingredients (e.g., chicken, tomatoes, garlic)"
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            numberOfLines={4}
            selectionColor="#FF6F61"
          />
          <TouchableOpacity
            style={[styles.button, animatedStyle]}
            onPress={fetchRecipe}
          >
            <Icon name="search" size={24} color="#fff" />
            <Text style={styles.buttonText}>Generate Recipe</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>With 💗 By IMAD</Text>
        </>
      )}

      {recipe && !loading && !error && (
        <View>
          <StatusBar style="dark" />

          {recipe.recipeName && (
            <Text style={styles.recipeTitle}>{recipe.recipeName}</Text>
          )}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            style={{
              borderWidth: 2,
              borderColor: "#FF6F61",
              borderRadius: 20,
              padding: 20,
            }}
          >
            {recipe.recipeDescription && (
              <Text style={styles.description}>
                <Text style={styles.boldOrange}>Description:</Text>{" "}
                {recipe.recipeDescription}
              </Text>
            )}
            {recipe.recipeIngredients && (
              <Text style={styles.ingredients}>
                <Text style={styles.boldOrange}>Ingredients:</Text>{" "}
                {"\n" + recipe.recipeIngredients}
              </Text>
            )}
            {recipe.recipeCookingSteps && (
              <Text style={styles.cookingSteps}>
                <Text style={styles.boldOrange}>Cooking Steps:</Text>{" "}
                {"\n" + recipe.recipeCookingSteps}
              </Text>
            )}
            {recipe.recipeBenefits && (
              <Text style={styles.benefits}>
                <Text style={styles.boldOrange}>Recipe Benefits:</Text>{" "}
                {"\n" + recipe.recipeBenefits}
              </Text>
            )}
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
              <Text>No image available.</Text>
            )}
            <View
              style={{
                alignItems: "center",
                marginVertical: 10,
                width: "100%",
              }}
            >
              <Text
                style={[
                  styles.boldOrange,
                  { textAlign: "center", fontSize: 20, marginBottom: 20 },
                ]}
              >
                The picture is not always accurate
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, animatedStyle]}
              onPress={goBack}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
              <Text style={styles.buttonText}></Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, animatedStyle]}
              onPress={generateAnotherRecipe}
            >
              <Icon name="refresh" size={24} color="#fff" />
              <Text style={styles.buttonText}></Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  header: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: "#FF6F61",
    marginBottom: -6,
    textAlign: "center",
  },
  semiheader: {
    fontFamily: "Poppins_700regular",
    fontSize: 15,
    color: "#FF6F61",
    marginBottom: 20,
    textAlign: "center",
  },
  textInput: {
    fontFamily: "Poppins_400Regular",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    borderColor: "#FF6F61",
    borderWidth: 2,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#F0F0F0",
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6F61",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    marginBottom: 5,
    marginTop: 0,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    fontFamily: "Poppins_700Bold",
    position: "absolute",
    bottom: 10,
    fontSize: 16,
    color: "#FF6F61",
    textAlign: "center",
  },
  scrollContainer: {
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#FF6F61",
    marginLeft: 10,
  },
  recipeTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#FF6F61",
    marginBottom: 10,
    marginTop: 70,
    textAlign: "center",
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "left",
  },
  ingredients: {
    fontFamily: "Poppins_400Regular",

    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "left",
  },
  cookingSteps: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "left",
  },
  benefits: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "left",
    marginLeft: 0,
  },
  image: {
    width: "100%",
    height: 250,
    marginVertical: 10,
    resizeMode: "cover",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FF6F61",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  boldOrange: {
    fontFamily: "Poppins_700Bold",
    color: "#FF6F61",
    fontSize: 18,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  loader: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  errorText: {
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
