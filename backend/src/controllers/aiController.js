import { GoogleGenAI } from '@google/genai';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

// Initialize Gemini
let ai;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.log("Failed to initialize Gemini AI", error.message);
}

// Basic Regex-based Simulated AI Fallback
const parsePromptBasic = (prompt) => {
  const result = { customerName: null, items: [], discount: 0 };
  
  // Extract discount (e.g. 10% discount)
  const discountMatch = prompt.match(/(\d+)\s*%\s*discount/i);
  if (discountMatch) {
    result.discount = parseInt(discountMatch[1], 10);
  }

  // Extract customer (e.g. for Rahul, to Rahul)
  const customerMatch = prompt.match(/(?:for|to|bill)\s+([a-zA-Z]+)/i);
  if (customerMatch && !['discount', 'products', 'items'].includes(customerMatch[1].toLowerCase())) {
    result.customerName = customerMatch[1];
  }

  // Extract items (e.g. 2 mouse, 1 keyboard, 5 laptop)
  // Look for number followed by word
  const itemRegex = /(\d+)\s+([a-zA-Z]+)/g;
  let match;
  while ((match = itemRegex.exec(prompt)) !== null) {
    if (!['discount'].includes(match[2].toLowerCase())) {
      result.items.push({
        quantity: parseInt(match[1], 10),
        productName: match[2]
      });
    }
  }

  return result;
};

// Use Gemini to parse the prompt
const parsePromptGemini = async (prompt) => {
  const systemPrompt = `You are an AI assistant for a billing/POS system. 
Extract the intent from the user's natural language input into the following JSON structure exactly:
{
  "customerName": "Extracted customer name, or null if none",
  "items": [
    { "productName": "Name of product", "quantity": number }
  ],
  "discount": number (in percentage, or 0 if none)
}
Only output the raw JSON. No markdown formatting. No backticks.
Input: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
    });
    
    let text = response.text.trim();
    // Clean up if it returned markdown
    if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw error; // Fallback to basic
  }
};


// @desc    Process Natural Language Billing Request
// @route   POST /api/ai/billing-assist
// @access  Private
export const processBillingPrompt = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    let parsedIntent;

    if (ai) {
      try {
        parsedIntent = await parsePromptGemini(prompt);
      } catch (err) {
        console.log("Falling back to simulated AI due to Gemini error");
        parsedIntent = parsePromptBasic(prompt);
      }
    } else {
      parsedIntent = parsePromptBasic(prompt);
    }

    // Now query the DB to find matches for the current business Owner
    const businessOwnerId = req.businessOwnerId;

    let matchedCustomer = null;
    if (parsedIntent.customerName) {
      // Find customer with regex matching name (case insensitive)
      matchedCustomer = await Customer.findOne({
        user: businessOwnerId,
        name: { $regex: new RegExp(parsedIntent.customerName, 'i') }
      }).select('_id name mobile openingBalance');
    }

    const cartItems = [];
    for (let item of parsedIntent.items) {
      // Find product matching name
      const product = await Product.findOne({
        user: businessOwnerId,
        name: { $regex: new RegExp(item.productName, 'i') }
      }).select('_id name sku sellingPrice purchasePrice stock gstRate image');

      if (product) {
        cartItems.push({
          product: product,
          quantity: item.quantity > product.stock ? product.stock : item.quantity,
          requestedQuantity: item.quantity,
          isOutOfStock: product.stock <= 0
        });
      }
    }

    res.json({
      success: true,
      parsedIntent,
      matchedCustomer,
      cartItems,
      discount: parsedIntent.discount,
      message: 'AI processing complete',
      isSimulated: !ai
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process AI billing request' });
  }
};
