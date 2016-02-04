import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by veren_000 on 04.02.2016.
 */
public class Main {
    private static final String OUTPUT_FILE = "frames.json";
    private static int LEVELS = 3;
    private static final String NEW_LINE = System.lineSeparator();
    private static final int WIDTH = 300;
    private static final int HEIGHT = 169;

    public static void main(String[] args) {

        if (args.length < 1) {
            System.out.println("Wrong number of parameters!");
            System.out.println("Usage: Main.java directoryPath [numLevels]");
            return;
        }

        File folder = new File(args[0]);
        if (!folder.isDirectory()) {
            System.out.println("Please provide the path of the directory!");
        }

        if (args.length == 2) {
            LEVELS = Integer.valueOf(args[1]);
        }

        // ffmpeg takes the first frame at about 2 seconds, and takes every 5 seconds a frame
        int seconds = 2;
        List<Frame> frames = new ArrayList<>();
        for (File file : folder.listFiles()) {
            frames.add(new Frame(seconds, file.getName()));
            seconds += 5;
        }
        int numFrames = frames.size();

        // find out the number of frames per segment
        // take the n-th root, round up
        int numFramesPerSegment = (int) Math.ceil(Math.pow(numFrames, 1.0 / LEVELS));

        List<Segment> cluster = new ArrayList<>();
        List<Segment> bottomSegments = new ArrayList<>();

        // create the lowest level
        boolean segmentFull = true;
        Segment curSegment = null;
        for (int i = 0; i < numFrames; i++) {

            if (segmentFull) {
                // create a new segment for this level
                curSegment = new Segment(LEVELS);
                segmentFull = false;
            }

            curSegment.getFrames().add(frames.get(i));

            if (curSegment.getFrames().size() >= numFramesPerSegment) {
                cluster.add(curSegment);
                bottomSegments.add(curSegment);
                curSegment = null;
                segmentFull = true;
            }
        }

        if (curSegment != null) {
            // add last segment which is not full to bottomSegments
            bottomSegments.add(curSegment);
        }

        List<Segment> curSegments = null;
        // create the upper level by combining the frames from the layer below
        for (int level = LEVELS - 1; level >= 1 ; level--) {

            segmentFull = true;
            curSegments = new ArrayList<>();

            for (Segment bottomSegment : bottomSegments) {
                if (segmentFull) {
                    // create a new segment for this level
                    curSegment = new Segment(level);
                    segmentFull = false;
                }

                // add the mid frame of the bottom segment to the current segment
                int index = numFramesPerSegment / 2;
                if (bottomSegment.getFrames().size() <= index) {
                    index = bottomSegment.getFrames().size() - 1;
                }
                Frame frame = bottomSegment.getFrames().get(index);
                Frame frameCopy = new Frame(frame.getSeconds(), frame.getFile());
                // add the whole segment to the list of childs
                frameCopy.setBottomSegment(bottomSegment);
                curSegment.getFrames().add(frameCopy);

                if (curSegment.getFrames().size() >= numFramesPerSegment) {
                    cluster.add(curSegment);
                    curSegments.add(curSegment);
                    curSegment = null;
                    segmentFull = true;
                }
            }

            if (curSegment != null) {
                // add last segment (which is not full) to curSegments
                curSegments.add(curSegment);
            }

            // go one step up in the hierarchy
            bottomSegments = curSegments;
        }

        // for the first level
        if (curSegments.isEmpty()) {
            curSegments.add(curSegment);
        }

        // curSegments contains the frames from the first level
        createJsonFile(curSegments);

    }

    private static void createJsonFile(List<Segment> curSegments) {
        try {
            File jsonFile = new File(OUTPUT_FILE);
            FileOutputStream is = new FileOutputStream(jsonFile);
            OutputStreamWriter osw = new OutputStreamWriter(is);
            Writer w = new BufferedWriter(osw);
            StringBuilder builder = new StringBuilder();

            // frames from the upper level, should be only 1 curSegment
            assert(curSegments.size() == 1);
            appendOneLevel(builder, curSegments.get(0));

            w.write(builder.toString());
            w.close();
            osw.close();
            is.close();

        } catch (IOException e) {
            System.err.println("Problem writing to the file " + OUTPUT_FILE);
        }
    }

    private static void appendOneLevel(StringBuilder builder, Segment curSegment) {
        builder.append("[");
        for (int j = 0; j < curSegment.getFrames().size(); j++) {
            Frame frame = curSegment.getFrames().get(j);
            builder.append("{");
            builder.append("\"src\": \"" + frame.getFile() + "\", \"time\": " + frame.getSeconds() + ", \"width\": " + WIDTH + ", \"height\": " + HEIGHT + ", \"childs\": ");
            if (frame.getBottomSegment() == null) {
                builder.append(" [ ] ");
            } else {
                appendOneLevel(builder, frame.getBottomSegment());
            }
            builder.append("}");

            if (j != curSegment.getFrames().size()-1) {
                builder.append(",");
            }
        }
        builder.append("]");
    }
}
