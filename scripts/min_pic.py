import os
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 脚本所在目录
INPUT_DIR = os.path.join(BASE_DIR, "input_images")
OUTPUT_DIR = os.path.join(BASE_DIR, "output_images")

def process_images(input_dir, output_dir, max_size=(800, 800), quality=80, crop_height=40, crop_width=120):
    """
    批量处理图片：缩小 -> 去水印裁剪 -> 转成 WebP
    :param input_dir: 输入文件夹
    :param output_dir: 输出文件夹
    :param max_size: 缩放最大尺寸 (宽, 高)
    :param quality: WebP 输出质量 (0-100)
    :param crop_height: 从底部裁掉的高度
    :param crop_width: 从右侧裁掉的宽度
    """
    os.makedirs(output_dir, exist_ok=True)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
            try:
                img_path = os.path.join(input_dir, filename)
                img = Image.open(img_path)

                # 缩放
                img.thumbnail(max_size)

                # 裁剪去水印（右下角）
                w, h = img.size
                img_cropped = img.crop((0, 0, w - crop_width, h - crop_height))

                # 保存为 webp
                base_name = os.path.splitext(filename)[0]
                save_path = os.path.join(output_dir, f"{base_name}.webp")
                img_cropped.save(save_path, "WEBP", quality=quality)

                print(f"✅ 处理完成: {filename} -> {save_path}")
            except Exception as e:
                print(f"❌ 处理 {filename} 出错: {e}")

if __name__ == "__main__":
    process_images(INPUT_DIR, OUTPUT_DIR, max_size=(800, 800), quality=80, crop_height=40, crop_width=120)
    input("全部完成！按回车键退出...")
