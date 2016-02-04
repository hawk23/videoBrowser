import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by veren_000 on 04.02.2016.
 */
public class Segment {

    private int level;
    private List<Frame> frames;
    private Segment topSegment;

    public Segment(int level) {
        frames = new ArrayList<>();
        this.level = level;
    }

    public List<Frame> getFrames() {
        return frames;
    }
}
