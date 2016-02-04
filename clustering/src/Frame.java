import java.util.ArrayList;
import java.util.List;

/**
 * Created by veren_000 on 04.02.2016.
 */
public class Frame {
    private int seconds;
    private String file;
    private Segment bottomSegment;

    public Segment getBottomSegment() {
        return bottomSegment;
    }

    public void setBottomSegment(Segment bottomSegment) {
        this.bottomSegment = bottomSegment;
    }

    public Frame(int seconds, String file) {
        this.seconds = seconds;
        this.file = file;
        bottomSegment = null;
    }

    public int getSeconds() {
        return seconds;
    }

    public void setSeconds(int seconds) {
        this.seconds = seconds;
    }

    public String getFile() {
        return file;
    }
}
