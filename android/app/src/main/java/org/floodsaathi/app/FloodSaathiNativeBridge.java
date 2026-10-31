package org.floodsaathi.app;

import android.content.Context;
import android.os.Environment;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native Android Storage Bridge for FloodSaathi.
 * Creates and manages the "FloodSaathi" folder (with "models" and "maps" subfolders)
 * on the mobile device so downloaded SLM model files and offline map packs are stored
 * in the FloodSaathi folder and loaded directly by the chatbot and map engine.
 */
public class FloodSaathiNativeBridge {
    private final Context context;
    private File rootFolder;
    private File modelsFolder;
    private File mapsFolder;

    public FloodSaathiNativeBridge(Context context) {
        this.context = context;
        initFolders();
    }

    private synchronized void initFolders() {
        try {
            // Try public Documents/FloodSaathi first so user can see it directly in File Manager
            File pubDocs = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
            File candidate = new File(pubDocs, "FloodSaathi");
            boolean canUsePublic = false;
            try {
                if (!candidate.exists()) {
                    candidate.mkdirs();
                }
                File testModels = new File(candidate, "models");
                if (!testModels.exists()) {
                    testModels.mkdirs();
                }
                File probe = new File(testModels, ".probe");
                try (FileOutputStream fos = new FileOutputStream(probe)) {
                    fos.write("ok".getBytes(StandardCharsets.UTF_8));
                }
                if (probe.exists()) {
                    probe.delete();
                    canUsePublic = true;
                }
            } catch (Exception ignored) {
                canUsePublic = false;
            }

            if (canUsePublic) {
                rootFolder = candidate;
            } else {
                // Fallback to app-specific external storage (/storage/emulated/0/Android/data/org.floodsaathi.app/files/FloodSaathi)
                File extDir = context.getExternalFilesDir(null);
                if (extDir == null) {
                    extDir = context.getFilesDir();
                }
                rootFolder = new File(extDir, "FloodSaathi");
            }

            modelsFolder = new File(rootFolder, "models");
            mapsFolder = new File(rootFolder, "maps");
            if (!rootFolder.exists()) rootFolder.mkdirs();
            if (!modelsFolder.exists()) modelsFolder.mkdirs();
            if (!mapsFolder.exists()) mapsFolder.mkdirs();

            // Write a marker README file so the folder is always visible in Android File Managers
            File readme = new File(rootFolder, "FloodSaathi_Storage_Info.txt");
            if (!readme.exists()) {
                String info = "FloodSaathi Local Storage Folder\n"
                    + "- FloodSaathi/models/ : Stores downloaded On-Device Neural AI Model weights, tokenizer & disaster knowledge matrix.\n"
                    + "- FloodSaathi/maps/   : Stores downloaded offline Punjab map packs and vector/raster tiles.\n";
                try (FileOutputStream fos = new FileOutputStream(readme)) {
                    fos.write(info.getBytes(StandardCharsets.UTF_8));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private File resolveSubFolder(String subDir) {
        initFolders();
        if ("models".equalsIgnoreCase(subDir)) return modelsFolder;
        if ("maps".equalsIgnoreCase(subDir)) return mapsFolder;
        File custom = new File(rootFolder, subDir);
        if (!custom.exists()) custom.mkdirs();
        return custom;
    }

    @JavascriptInterface
    public String ensureAppFolder() {
        return getFolderStatus();
    }

    @JavascriptInterface
    public String getFolderStatus() {
        try {
            initFolders();
            JSONObject res = new JSONObject();
            res.put("initialized", true);
            res.put("appFolderName", "FloodSaathi");
            res.put("folderPath", rootFolder != null ? rootFolder.getAbsolutePath() : "FloodSaathi");
            res.put("modelsPath", modelsFolder != null ? modelsFolder.getAbsolutePath() : "FloodSaathi/models");
            res.put("mapsPath", mapsFolder != null ? mapsFolder.getAbsolutePath() : "FloodSaathi/maps");

            JSONArray modelArr = new JSONArray();
            long totalModelBytes = 0;
            if (modelsFolder != null && modelsFolder.exists()) {
                File[] files = modelsFolder.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile() && !f.getName().startsWith(".")) {
                            JSONObject fo = new JSONObject();
                            fo.put("name", f.getName());
                            fo.put("sizeBytes", f.length());
                            fo.put("path", f.getAbsolutePath());
                            modelArr.put(fo);
                            totalModelBytes += f.length();
                        }
                    }
                }
            }
            res.put("modelFiles", modelArr);
            res.put("totalModelBytes", totalModelBytes);
            res.put("modelReady", modelArr.length() > 0 && totalModelBytes > 0);

            JSONArray mapArr = new JSONArray();
            long totalMapBytes = 0;
            if (mapsFolder != null && mapsFolder.exists()) {
                File[] files = mapsFolder.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile() && !f.getName().startsWith(".")) {
                            JSONObject fo = new JSONObject();
                            fo.put("name", f.getName());
                            fo.put("sizeBytes", f.length());
                            fo.put("path", f.getAbsolutePath());
                            mapArr.put(fo);
                            totalMapBytes += f.length();
                        }
                    }
                }
            }
            res.put("mapFiles", mapArr);
            res.put("totalMapBytes", totalMapBytes);

            return res.toString();
        } catch (Exception e) {
            return "{\"initialized\":false,\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    @JavascriptInterface
    public boolean saveFile(String subDir, String fileName, String content) {
        try {
            File dir = resolveSubFolder(subDir);
            String safeName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            File target = new File(dir, safeName);
            try (FileOutputStream fos = new FileOutputStream(target)) {
                fos.write(content.getBytes(StandardCharsets.UTF_8));
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public boolean saveBase64File(String subDir, String fileName, String base64Data) {
        try {
            File dir = resolveSubFolder(subDir);
            String safeName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            File target = new File(dir, safeName);
            byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);
            try (FileOutputStream fos = new FileOutputStream(target)) {
                fos.write(decoded);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public String readFile(String subDir, String fileName) {
        try {
            File dir = resolveSubFolder(subDir);
            String safeName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            File target = new File(dir, safeName);
            if (!target.exists()) return null;
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(new FileInputStream(target), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(line);
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    @JavascriptInterface
    public boolean deleteSubFolderFiles(String subDir) {
        try {
            File dir = resolveSubFolder(subDir);
            if (dir != null && dir.exists()) {
                File[] files = dir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile()) f.delete();
                    }
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
