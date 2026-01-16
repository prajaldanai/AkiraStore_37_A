const { ProductComment, User } = require("../models");

/* ============================================================
   GET COMMENTS FOR A PRODUCT
============================================================ */
exports.getProductComments = async (req, res) => {
  try {
    const { productId } = req.params;

    const comments = await ProductComment.findAll({
      where: { product_id: productId },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      username: c.User?.username || "Anonymous",
      comment_text: c.comment_text,
      created_at: c.created_at,
    }));

    return res.json({ success: true, comments: formatted });
  } catch (err) {
    console.error("getProductComments ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load comments" });
  }
};

/* ============================================================
   ADD NEW COMMENT (REQUIRES AUTH)
============================================================ */
exports.addComment = async (req, res) => {
  try {
    const { product_id, comment_text } = req.body;
    // JWT payload uses 'userId', not 'id'
    const user_id = req.user?.userId || req.user?.id;

    if (!user_id) {
      return res.status(401).json({ success: false, message: "Please log in to comment" });
    }

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    if (!comment_text || comment_text.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Comment must be at least 5 characters" });
    }

    const newComment = await ProductComment.create({
      product_id,
      user_id,
      comment_text: comment_text.trim(),
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully",
      comment: {
        id: newComment.id,
        product_id: newComment.product_id,
        comment_text: newComment.comment_text,
        created_at: newComment.created_at,
      },
    });
  } catch (err) {
    console.error("addComment ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to post comment" });
  }
};

/* ============================================================
   DELETE COMMENT (OWNER OR ADMIN ONLY)
============================================================ */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    // JWT payload uses 'userId', not 'id'
    const user_id = req.user?.userId || req.user?.id;
    const isAdmin = req.user?.role === "admin";

    const comment = await ProductComment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only allow owner or admin to delete
    if (comment.user_id !== user_id && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    await comment.destroy();

    return res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("deleteComment ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};
