import os
from PIL import Image

def batch_resize_to_webp(input_dir, output_dir, max_size=(800, 800), quality=80):
    """
    批量缩小图片并转成 webp 格式
    :param input_dir: 输入图片文件夹
    :param output_dir: 输出文件夹
    :param max_size: 最大尺寸 (宽, 高)
    :param quality: webp 输出质量 (0-100)
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for file_name in os.listdir(input_dir):
        file_path = os.path.join(input_dir, file_name)

        # 只处理常见图片格式
        if file_name.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff")):
            try:
                with Image.open(file_path) as img:
                    # 缩放
                    img.thumbnail(max_size)

                    # 输出文件名（改成 .webp）
                    base_name = os.path.splitext(file_name)[0]
                    output_path = os.path.join(output_dir, f"{base_name}.webp")

                    # 保存为 webp
                    img.save(output_path, "WEBP", quality=quality)
                    print(f"已处理: {file_name} -> {output_path}")
            except Exception as e:
                print(f"处理 {file_name} 出错: {e}")

if __name__ == "__main__":
    input_folder = "public/images"   # 输入文件夹
    output_folder = "compressed_images" # 输出文件夹
    batch_resize_to_webp(input_folder, output_folder, max_size=(800, 800), quality=80)
