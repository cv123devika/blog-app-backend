const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/Blog");

// MULTER — memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });


// =====================
// UPLOAD IMAGE
// =====================
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {

    // CONFIG INSIDE ROUTE so env is loaded
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "blog-images",
    });

    res.json({ url: result.secure_url });

  } catch (error) {
    console.log("IMAGE UPLOAD ERROR:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});


// =====================
// CREATE BLOG
// =====================
router.post("/create", async (req, res) => {
  try {
    const { title, description, author, category, userId } = req.body;

    if (!title || !description || !category || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBlog = new Blog({ title, description, author, category, userId });
    await newBlog.save();

    res.json({ message: "Blog created successfully" });

  } catch (error) {
    console.log("CREATE BLOG ERROR:", error);
    res.status(500).json({ message: "Error creating blog" });
  }
});


// =====================
// GET ALL BLOGS
// =====================
router.get("/all", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.log("GET ALL BLOGS ERROR:", error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

// =====================
// SEARCH BLOGS
// =====================
router.get("/search", async (req, res) => {
  try {

    const query = req.query.query || "";

    const blogs = await Blog.find({
      $or: [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    }).sort({ createdAt: -1 });

    res.json(blogs);

  } catch (error) {
    console.log("SEARCH BLOG ERROR:", error);
    res.status(500).json({
      message: "Error searching blogs",
    });
  }
});


// =====================
// GET MY BLOGS
// =====================
router.get("/my/:userId", async (req, res) => {
  try {
    const blogs = await Blog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.log("GET MY BLOGS ERROR:", error);
    res.status(500).json({ message: "Error fetching user blogs" });
  }
});


// =====================
// GET SINGLE BLOG
// =====================
router.get("/single/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.query.userId;

    if (!userId) {
      return res.json({
        _id: blog._id,
        title: blog.title,
        category: blog.category,
        author: blog.author,
        createdAt: blog.createdAt,
        description: blog.description.slice(0, 300),
        likes: blog.likes,
        comments: [],
        isPreview: true,
      });
    }

    res.json({ ...blog.toObject(), isPreview: false });

  } catch (error) {
    console.log("GET SINGLE BLOG ERROR:", error);
    res.status(500).json({ message: "Error fetching blog" });
  }
});


// =====================
// UPDATE BLOG
// =====================
router.put("/update/:id", async (req, res) => {
  try {
    const { title, description, category } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, description, category },
      { new: true }
    );

    if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

    res.json({ message: "Blog updated successfully", blog: updatedBlog });

  } catch (error) {
    console.log("UPDATE BLOG ERROR:", error);
    res.status(500).json({ message: "Error updating blog" });
  }
});


// =====================
// DELETE BLOG
// =====================
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.log("DELETE BLOG ERROR:", error);
    res.status(500).json({ message: "Error deleting blog" });
  }
});


// =====================
// LIKE BLOG
// =====================
router.post("/like/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const { userId } = req.body;

    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter((id) => id.toString() !== userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ message: "Like updated", likes: blog.likes.length });

  } catch (error) {
    console.log("LIKE BLOG ERROR:", error);
    res.status(500).json({ message: "Error liking blog" });
  }
});


// =====================
// ADD COMMENT
// =====================
router.post("/comment/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const { userId, author, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment cannot be empty" });

    blog.comments.push({ userId, author, text: text.trim() });
    await blog.save();

    res.json({ message: "Comment added successfully", comments: blog.comments });

  } catch (error) {
    console.log("COMMENT BLOG ERROR:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});


// =====================
// UPDATE COMMENT
// =====================
router.put("/comment/:blogId/:commentId", async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.text = req.body.text;
    await blog.save();

    res.json({ message: "Comment updated successfully" });

  } catch (error) {
    console.log("UPDATE COMMENT ERROR:", error);
    res.status(500).json({ message: "Error updating comment" });
  }
});


// =====================
// DELETE COMMENT
// =====================
router.delete("/comment/:blogId/:commentId", async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.comments = blog.comments.filter((c) => c._id.toString() !== commentId);
    await blog.save();

    res.json({ message: "Comment deleted successfully" });

  } catch (error) {
    console.log("DELETE COMMENT ERROR:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
});


// =====================
// ADD REPLY
// =====================
router.post("/comment/:blogId/:commentId/reply", async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { userId, author, text } = req.body;

    if (!userId || !author || !text?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({ userId, author, text: text.trim() });
    await blog.save();

    res.json({ message: "Reply added successfully", replies: comment.replies });

  } catch (error) {
    console.error("ADD REPLY ERROR:", error);
    res.status(500).json({ message: "Error adding reply" });
  }
});


// =====================
// UPDATE REPLY
// =====================
router.put("/comment/:blogId/:commentId/reply/:replyId", async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Reply cannot be empty" });

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    reply.text = text.trim();
    await blog.save();

    res.json({ message: "Reply updated successfully" });

  } catch (error) {
    console.log("UPDATE REPLY ERROR:", error);
    res.status(500).json({ message: "Error updating reply" });
  }
});


// =====================
// DELETE REPLY
// =====================
router.delete("/comment/:blogId/:commentId/reply/:replyId", async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies = comment.replies.filter((r) => r._id.toString() !== replyId);
    await blog.save();

    res.json({ message: "Reply deleted successfully" });

  } catch (error) {
    console.log("DELETE REPLY ERROR:", error);
    res.status(500).json({ message: "Error deleting reply" });
  }
});


module.exports = router;