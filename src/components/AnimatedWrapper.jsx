"use client";
import { motion } from "framer-motion";

/**
 * AnimatedWrapper يحرك العناصر الداخلية Fade + Slide + Scale + Bounce
 * - حركة سلسة وواضحة
 * - دعم stagger للأطفال
 * - تأثير spring لإحساس طبيعي وحيوي
 */
export default function AnimatedWrapper({ children }) {
  // إعدادات الحاوية
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04, // كل عنصر يظهر بعد الآخر - أسرع
      },
    },
  };

  // إعدادات العناصر الفردية
  const item = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "tween",
        ease: "easeOut",
        duration: 0.2, // أسرع بكثير
      },
    },
  };

  // التعامل مع عناصر متعددة أو عنصر واحد
  const renderChildren = (children) => {
    if (Array.isArray(children)) {
      return children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ));
    }
    return <motion.div variants={item}>{children}</motion.div>;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      {renderChildren(children)}
    </motion.div>
  );
}
